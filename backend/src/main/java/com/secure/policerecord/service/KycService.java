package com.secure.policerecord.service;

import com.secure.policerecord.exception.BadRequestException;
import com.secure.policerecord.exception.ResourceNotFoundException;
import com.secure.policerecord.model.*;
import com.secure.policerecord.repository.*;
import com.secure.policerecord.request.KycSubmitRequest;
import com.secure.policerecord.request.KycVerifyRequest;
import com.secure.policerecord.response.KycResponse;
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
public class KycService {

    private final KycRepository kycRepository;
    private final CitizenRepository citizenRepository;
    private final UserRepository userRepository;
    private final HashUtil hashUtil;
    private final ReferenceGenerator referenceGenerator;
    private final AuditService auditService;
    private final FabricService fabricService;

    @Transactional
    public KycResponse submitKycRequest(KycSubmitRequest request) {
        Citizen citizen = citizenRepository
                .findByReferenceNumber(request.getCitizenReferenceNumber())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Citizen not found with reference: " + request.getCitizenReferenceNumber()));

        List<com.secure.policerecord.model.KycRequest> existing =
                kycRepository.findByCitizenId(citizen.getId());
        boolean hasPending = existing.stream()
                .anyMatch(k -> k.getStatus() == KycStatus.PENDING
                        || k.getStatus() == KycStatus.IN_PROGRESS);
        if (hasPending) {
            throw new BadRequestException(
                    "A KYC request is already pending for this citizen");
        }

        String requestNumber = referenceGenerator.generateKycNumber();
        String recordData = citizen.getId().toString() + requestNumber;
        String reportHash = hashUtil.generateSHA256(recordData);

        com.secure.policerecord.model.KycRequest kycRequest =
                com.secure.policerecord.model.KycRequest.builder()
                        .requestNumber(requestNumber)
                        .citizen(citizen)
                        .status(KycStatus.PENDING)
                        .reportHash(reportHash)
                        .submittedAt(LocalDateTime.now())
                        .build();

        kycRepository.save(kycRequest);

        auditService.logAction(
                "SYSTEM", "KYC_SUBMITTED", "KYC_REQUEST",
                kycRequest.getRequestNumber(),
                "KYC request submitted for citizen: " + citizen.getReferenceNumber(),
                null
        );

        return mapToResponse(kycRequest);
    }

    @Transactional
    public KycResponse verifyKycRequest(KycVerifyRequest request, String officerUsername) {
        com.secure.policerecord.model.KycRequest kycRequest =
                kycRepository.findByRequestNumber(request.getRequestNumber())
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "KYC request not found: " + request.getRequestNumber()));

        User officer = userRepository.findByUsername(officerUsername)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Officer not found"));

        KycStatus newStatus = KycStatus.valueOf(request.getStatus().toUpperCase());

        kycRequest.setStatus(newStatus);
        kycRequest.setAssignedOfficer(officer);
        kycRequest.setVerifiedAt(LocalDateTime.now());

        if (request.getRemarks() != null) {
            kycRequest.setVerificationRemarksEncrypted(request.getRemarks());
        }

        String updatedHash = hashUtil.generateSHA256(
                kycRequest.getRequestNumber() +
                        newStatus.name() +
                        LocalDateTime.now()
        );
        kycRequest.setReportHash(updatedHash);

        kycRepository.save(kycRequest);

        auditService.logAction(
                officerUsername, "KYC_VERIFIED", "KYC_REQUEST",
                kycRequest.getRequestNumber(),
                "KYC request " + newStatus.name() + " by officer",
                null
        );

        String txId = fabricService.storeKycHash(
                kycRequest.getRequestNumber(),
                kycRequest.getCitizen().getReferenceNumber(),
                kycRequest.getReportHash(),
                newStatus.name(),
                officerUsername
        );
        if (txId != null) {
            kycRequest.setBlockchainTxId(txId);
            kycRepository.save(kycRequest);
        }

        return mapToResponse(kycRequest);
    }

    public KycResponse getKycStatus(String requestNumber) {
        com.secure.policerecord.model.KycRequest kycRequest =
                kycRepository.findByRequestNumber(requestNumber)
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "KYC request not found: " + requestNumber));
        return mapToResponse(kycRequest);
    }

    public List<KycResponse> getPendingKycRequests() {
        return kycRepository.findByStatus(KycStatus.PENDING)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<KycResponse> getKycRequestsByCitizen(UUID citizenId) {
        return kycRepository.findByCitizenId(citizenId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<KycResponse> getKycRequestsByOfficer(String officerUsername) {
        User officer = userRepository.findByUsername(officerUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Officer not found"));
        return kycRepository.findByAssignedOfficerId(officer.getId())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private KycResponse mapToResponse(com.secure.policerecord.model.KycRequest kycRequest) {
        return KycResponse.builder()
                .id(kycRequest.getId().toString())
                .requestNumber(kycRequest.getRequestNumber())
                .citizenReference(kycRequest.getCitizen().getReferenceNumber())
                .status(kycRequest.getStatus().name())
                .assignedOfficer(kycRequest.getAssignedOfficer() != null ?
                        kycRequest.getAssignedOfficer().getFullName() : "Unassigned")
                .blockchainTxId(kycRequest.getBlockchainTxId())
                .submittedAt(kycRequest.getSubmittedAt() != null ?
                        kycRequest.getSubmittedAt().toString() : null)
                .verifiedAt(kycRequest.getVerifiedAt() != null ?
                        kycRequest.getVerifiedAt().toString() : null)
                .build();
    }
}