package com.secure.policerecord.service;

import com.secure.policerecord.exception.BadRequestException;
import com.secure.policerecord.exception.ResourceNotFoundException;
import com.secure.policerecord.model.*;
import com.secure.policerecord.repository.*;
import com.secure.policerecord.request.FirearmRequest;
import com.secure.policerecord.request.FirearmStatusRequest;
import com.secure.policerecord.response.FirearmResponse;
import com.secure.policerecord.util.CryptoUtil;
import com.secure.policerecord.util.HashUtil;
import com.secure.policerecord.util.ReferenceGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.secure.policerecord.fabric.FabricService;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FirearmService {

    private final FirearmRepository firearmRepository;
    private final CitizenRepository citizenRepository;
    private final UserRepository userRepository;
    private final KycRepository kycRepository;
    private final AntecedentRepository antecedentRepository;
    private final CryptoUtil cryptoUtil;
    private final HashUtil hashUtil;
    private final ReferenceGenerator referenceGenerator;
    private final AuditService auditService;
    private final FabricService fabricService;
    private final CertificateRepository certificateRepository;

    @Transactional
    public FirearmResponse applyForLicense(FirearmRequest request) {
        Citizen citizen = citizenRepository
                .findByReferenceNumber(request.getCitizenReferenceNumber())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Citizen not found: " + request.getCitizenReferenceNumber()));

        List<KycRequest> kycRequests = kycRepository.findByCitizenId(citizen.getId());
        boolean hasVerifiedKyc = kycRequests.stream()
                .anyMatch(k -> k.getStatus() == KycStatus.VERIFIED);
        if (!hasVerifiedKyc) {
            throw new BadRequestException(
                    "Cannot apply for firearm license: KYC verification required first");
        }

        if (request.getBiometricVerified() == null || !request.getBiometricVerified()) {
            throw new BadRequestException(
                    "Biometric verification is required before submitting a firearm application");
        }

        List<FirearmApplication> existing = firearmRepository
                .findByCitizenId(citizen.getId());
        boolean hasActive = existing.stream()
                .anyMatch(f -> f.getStatus() == FirearmStatus.SUBMITTED
                        || f.getStatus() == FirearmStatus.UNDER_REVIEW
                        || f.getStatus() == FirearmStatus.ANTECEDENT_CHECK
                        || f.getStatus() == FirearmStatus.APPROVED);
        if (hasActive) {
            throw new BadRequestException(
                    "An active firearm application already exists for this citizen");
        }

        String applicationNumber = referenceGenerator.generateFirearmNumber();
        String purposeEncrypted = cryptoUtil.encrypt(request.getPurpose());
        String recordData = applicationNumber + citizen.getId() + request.getWeaponType();
        String reportHash = hashUtil.generateSHA256(recordData);

        FirearmApplication application = FirearmApplication.builder()
                .applicationNumber(applicationNumber)
                .citizen(citizen)
                .weaponType(request.getWeaponType())
                .purposeEncrypted(purposeEncrypted)
                .status(FirearmStatus.SUBMITTED)
                .reportHash(reportHash)
                .biometricVerified(true)
                .biometricVerifiedAt(LocalDateTime.now())
                .build();

        firearmRepository.save(application);

        auditService.logAction(
                "SYSTEM", "FIREARM_APPLIED", "FIREARM_APPLICATION",
                applicationNumber,
                "Firearm license applied for citizen: " + citizen.getReferenceNumber(),
                null
        );

        return mapToResponse(application);
    }

    @Transactional
    public FirearmResponse updateStatus(FirearmStatusRequest request,
                                        String officerUsername) {
        FirearmApplication application = firearmRepository
                .findByApplicationNumber(request.getApplicationNumber())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Application not found: " + request.getApplicationNumber()));

        User officer = userRepository.findByUsername(officerUsername)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Officer not found: " + officerUsername));

        FirearmStatus newStatus = FirearmStatus.valueOf(
                request.getStatus().toUpperCase());

        //require a CLEAR antecedent report before approving
        if (newStatus == FirearmStatus.APPROVED) {
            List<AntecedentReport> reports = antecedentRepository
                    .findByCitizenId(application.getCitizen().getId());
            boolean hasClearReport = reports.stream()
                    .anyMatch(r -> r.getOverallStatus() == AntecedentStatus.CLEAR);
            if (!hasClearReport) {
                throw new BadRequestException(
                        "Cannot approve: no CLEAR antecedent report found for this citizen");
            }
        }

        application.setStatus(newStatus);

        if (newStatus == FirearmStatus.APPROVED) {
            application.setLicensingAuthority(officer);
            application.setLicenseNumber(referenceGenerator.generateLicenseNumber());
            application.setIssueDate(LocalDateTime.now());
            application.setExpiryDate(LocalDateTime.now().plusYears(3));
        } else if (newStatus == FirearmStatus.REJECTED) {
            application.setLicensingAuthority(officer);
            if (request.getReason() != null) {
                application.setRejectionReasonEncrypted(
                        cryptoUtil.encrypt(request.getReason()));
            }
        } else if (newStatus == FirearmStatus.REVOKED) {
            application.setRevokedAt(LocalDateTime.now());
            if (request.getReason() != null) {
                application.setRevocationReasonEncrypted(
                        cryptoUtil.encrypt(request.getReason()));
            }
            // Auto-revoke linked certificate
            certificateRepository.findByCitizenId(application.getCitizen().getId())
                    .stream()
                    .filter(c -> c.getReferenceId().equals(application.getId())
                            && c.getStatus() == CertificateStatus.VALID)
                    .forEach(c -> {
                        c.setStatus(CertificateStatus.REVOKED);
                        c.setRevokedAt(LocalDateTime.now());
                        c.setRevocationReason(
                                request.getReason() != null ? request.getReason() : "License revoked");
                        certificateRepository.save(c);
                    });
        } else {
            application.setAssignedOfficer(officer);
        }

        String updatedHash = hashUtil.generateSHA256(
                application.getApplicationNumber() + newStatus.name() + LocalDateTime.now());
        application.setReportHash(updatedHash);

        firearmRepository.save(application);

        auditService.logAction(
                officerUsername, "FIREARM_STATUS_UPDATED", "FIREARM_APPLICATION",
                application.getApplicationNumber(),
                "Status updated to: " + newStatus.name(),
                null
        );

        String txId = fabricService.storeFirearmHash(
                application.getApplicationNumber(),
                application.getLicenseNumber(),
                application.getCitizen().getReferenceNumber(),
                application.getWeaponType(),
                application.getReportHash(),
                newStatus.name(),
                officerUsername
        );
        if (txId != null) {
            application.setBlockchainTxId(txId);
            firearmRepository.save(application);
        }

        if (newStatus == FirearmStatus.REVOKED) {
            fabricService.revokeFirearmLicense(
                    application.getApplicationNumber(),
                    request.getReason(),
                    officerUsername
            );
        }

        return mapToResponse(application);
    }

    @Transactional(readOnly = true)
    public FirearmResponse getApplicationByNumber(String applicationNumber) {
        FirearmApplication application = firearmRepository
                .findByApplicationNumber(applicationNumber)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Application not found: " + applicationNumber));
        return mapToResponse(application);
    }

    @Transactional(readOnly = true)
    public FirearmResponse getLicenseByNumber(String licenseNumber) {
        FirearmApplication application = firearmRepository
                .findByLicenseNumber(licenseNumber)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "License not found: " + licenseNumber));
        return mapToResponse(application);
    }

    @Transactional(readOnly = true)
    public List<FirearmResponse> getApplicationsByCitizen(UUID citizenId) {
        return firearmRepository.findByCitizenId(citizenId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FirearmResponse> getApplicationsByStatus(String status) {
        FirearmStatus firearmStatus = FirearmStatus.valueOf(status.toUpperCase());
        return firearmRepository.findByStatus(firearmStatus)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FirearmResponse> getAllApplications() {
        return firearmRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FirearmResponse> getApplicationsByCitizenReference(String citizenReference) {
        Citizen citizen = citizenRepository.findByReferenceNumber(citizenReference)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Citizen not found: " + citizenReference));
        return firearmRepository.findByCitizenId(citizen.getId())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private FirearmResponse mapToResponse(FirearmApplication application) {
        return FirearmResponse.builder()
                .id(application.getId().toString())
                .applicationNumber(application.getApplicationNumber())
                .citizenReference(application.getCitizen().getReferenceNumber())
                .citizenName(cryptoUtil.decrypt(application.getCitizen().getFullNameEncrypted()))
                .weaponType(application.getWeaponType())
                .purpose(cryptoUtil.decrypt(application.getPurposeEncrypted()))
                .status(application.getStatus().name())
                .licenseNumber(application.getLicenseNumber())
                .issueDate(application.getIssueDate() != null
                        ? application.getIssueDate().toString() : null)
                .expiryDate(application.getExpiryDate() != null
                        ? application.getExpiryDate().toString() : null)
                .blockchainTxId(application.getBlockchainTxId())
                .biometricVerified(application.getBiometricVerified())
                .createdAt(LocalDateTime.now().toString())
                .build();
    }
}