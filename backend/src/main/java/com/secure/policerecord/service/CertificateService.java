package com.secure.policerecord.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.secure.policerecord.exception.BadRequestException;
import com.secure.policerecord.exception.ResourceNotFoundException;
import com.secure.policerecord.model.*;
import com.secure.policerecord.repository.*;
import com.secure.policerecord.response.CertificateResponse;
import com.secure.policerecord.util.HashUtil;
import com.secure.policerecord.util.ReferenceGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CertificateService {

    private final CertificateRepository certificateRepository;
    private final CitizenRepository citizenRepository;
    private final FirearmRepository firearmRepository;
    private final KycRepository kycRepository;
    private final UserRepository userRepository;
    private final HashUtil hashUtil;
    private final ReferenceGenerator referenceGenerator;
    private final AuditService auditService;

    @Transactional
    public CertificateResponse generateFirearmCertificate(
            String applicationNumber, String officerUsername) {

        FirearmApplication application = firearmRepository
                .findByApplicationNumber(applicationNumber)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Application not found: " + applicationNumber));

        if (application.getStatus() != FirearmStatus.APPROVED) {
            throw new BadRequestException(
                    "Cannot generate certificate — application is not approved");
        }

        User officer = userRepository.findByUsername(officerUsername)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Officer not found: " + officerUsername));

        String certificateId = referenceGenerator.generateCertificateId();

        String qrContent = buildFirearmQrContent(application, certificateId);
        String qrBase64 = generateQRCodeBase64(qrContent);

        String certData = certificateId + applicationNumber
                + application.getLicenseNumber() + LocalDateTime.now();
        String documentHash = hashUtil.generateSHA256(certData);

        Certificate certificate = Certificate.builder()
                .certificateId(certificateId)
                .certificateType("FIREARM_LICENSE")
                .citizen(application.getCitizen())
                .referenceId(application.getId())
                .status(CertificateStatus.VALID)
                .issuedBy(officer)
                .issueDate(LocalDateTime.now())
                .expiryDate(application.getExpiryDate())
                .qrCodePath(qrBase64)
                .documentHash(documentHash)
                .build();

        certificateRepository.save(certificate);

        auditService.logAction(
                officerUsername, "CERTIFICATE_GENERATED", "CERTIFICATE",
                certificateId,
                "Firearm certificate generated for: " + applicationNumber,
                null
        );

        return mapToResponse(certificate);
    }

    @Transactional
    public CertificateResponse generateKycCertificate(
            String requestNumber, String officerUsername) {

        com.secure.policerecord.model.KycRequest kycRequest =
                kycRepository.findByRequestNumber(requestNumber)
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "KYC request not found: " + requestNumber));

        if (kycRequest.getStatus() != KycStatus.VERIFIED) {
            throw new BadRequestException(
                    "Cannot generate certificate — KYC is not verified");
        }

        User officer = userRepository.findByUsername(officerUsername)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Officer not found: " + officerUsername));

        String certificateId = referenceGenerator.generateCertificateId();

        String qrContent = buildKycQrContent(kycRequest, certificateId);
        String qrBase64 = generateQRCodeBase64(qrContent);

        String certData = certificateId + requestNumber + LocalDateTime.now();
        String documentHash = hashUtil.generateSHA256(certData);

        Certificate certificate = Certificate.builder()
                .certificateId(certificateId)
                .certificateType("KYC_VERIFICATION")
                .citizen(kycRequest.getCitizen())
                .referenceId(kycRequest.getId())
                .status(CertificateStatus.VALID)
                .issuedBy(officer)
                .issueDate(LocalDateTime.now())
                .expiryDate(LocalDateTime.now().plusYears(1))
                .qrCodePath(qrBase64)
                .documentHash(documentHash)
                .build();

        certificateRepository.save(certificate);

        auditService.logAction(
                officerUsername, "KYC_CERTIFICATE_GENERATED", "CERTIFICATE",
                certificateId,
                "KYC certificate generated for: " + requestNumber,
                null
        );

        return mapToResponse(certificate);
    }

    @Transactional(readOnly = true)
    public CertificateResponse verifyCertificate(String certificateId) {
        Certificate certificate = certificateRepository
                .findByCertificateId(certificateId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Certificate not found: " + certificateId));
        return mapToResponse(certificate);
    }

    @Transactional
    public CertificateResponse revokeCertificate(String certificateId,
                                                 String reason, String officerUsername) {
        Certificate certificate = certificateRepository
                .findByCertificateId(certificateId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Certificate not found: " + certificateId));

        certificate.setStatus(CertificateStatus.REVOKED);
        certificate.setRevokedAt(LocalDateTime.now());
        certificate.setRevocationReason(reason);

        certificateRepository.save(certificate);

        auditService.logAction(
                officerUsername, "CERTIFICATE_REVOKED", "CERTIFICATE",
                certificateId,
                "Certificate revoked: " + reason,
                null
        );

        return mapToResponse(certificate);
    }

    @Transactional(readOnly = true)
    public List<CertificateResponse> getCertificatesByCitizen(UUID citizenId) {
        return certificateRepository.findByCitizenId(citizenId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private String generateQRCodeBase64(String content) {
        try {
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            Map<EncodeHintType, Object> hints = new HashMap<>();
            hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");
            BitMatrix bitMatrix = qrCodeWriter.encode(
                    content, BarcodeFormat.QR_CODE, 500, 500, hints);
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);
            return Base64.getEncoder().encodeToString(outputStream.toByteArray());
        } catch (WriterException | IOException e) {
            throw new RuntimeException("QR code generation failed", e);
        }
    }

    private String buildFirearmQrContent(FirearmApplication application,
                                          String certificateId) {
        return "http://localhost:8080/api/certificates/verify/" + certificateId;
    }

    private String buildKycQrContent(
            com.secure.policerecord.model.KycRequest kycRequest,
            String certificateId) {
        return "http://localhost:8080/api/certificates/verify/" + certificateId;
    }

    private CertificateResponse mapToResponse(Certificate certificate) {
        String actorName = "System";
        try {
            if (certificate.getIssuedBy() != null) {
                actorName = certificate.getIssuedBy().getFullName();
            }
        } catch (Exception e) {
            actorName = "System";
        }

        String citizenRef = null;
        try {
            if (certificate.getCitizen() != null) {
                citizenRef = certificate.getCitizen().getReferenceNumber();
            }
        } catch (Exception e) {
            citizenRef = null;
        }

        return CertificateResponse.builder()
                .id(certificate.getId().toString())
                .certificateId(certificate.getCertificateId())
                .certificateType(certificate.getCertificateType())
                .citizenReference(citizenRef)
                .status(certificate.getStatus().name())
                .issuedBy(actorName)
                .issueDate(certificate.getIssueDate() != null
                        ? certificate.getIssueDate().toString() : null)
                .expiryDate(certificate.getExpiryDate() != null
                        ? certificate.getExpiryDate().toString() : null)
                .qrCodeBase64(certificate.getQrCodePath())
                .documentHash(certificate.getDocumentHash())
                .blockchainTxId(certificate.getBlockchainTxId())
                .revokedAt(certificate.getRevokedAt() != null
                        ? certificate.getRevokedAt().toString() : null)
                .revocationReason(certificate.getRevocationReason())
                .build();
    }

    @Transactional(readOnly = true)
    public com.secure.policerecord.response.CertificateVerifyResponse verifyCertificatePublic(String certificateId) {
        Certificate certificate = certificateRepository
                .findByCertificateId(certificateId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Certificate not found: " + certificateId));

        return com.secure.policerecord.response.CertificateVerifyResponse.builder()
                .certificateId(certificate.getCertificateId())
                .certificateType(certificate.getCertificateType())
                .status(certificate.getStatus().name())
                .issueDate(certificate.getIssueDate() != null
                        ? certificate.getIssueDate().toString() : null)
                .expiryDate(certificate.getExpiryDate() != null
                        ? certificate.getExpiryDate().toString() : null)
                .documentHash(certificate.getDocumentHash())
                .blockchainTxId(certificate.getBlockchainTxId())
                .revokedAt(certificate.getRevokedAt() != null
                        ? certificate.getRevokedAt().toString() : null)
                .revocationReason(certificate.getRevocationReason())
                .build();
    }

    @Transactional(readOnly = true)
    public List<CertificateResponse> getCertificatesByCitizenReference(String citizenReference) {
        Citizen citizen = citizenRepository.findByReferenceNumber(citizenReference)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Citizen not found: " + citizenReference));
        return certificateRepository.findByCitizenId(citizen.getId())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
}