package com.secure.policerecord.controller;

import com.secure.policerecord.response.ApiResponse;
import com.secure.policerecord.response.CertificateResponse;
import com.secure.policerecord.service.CertificateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/certificates")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CertificateController {

    private final CertificateService certificateService;

    @PostMapping("/firearm/{applicationNumber}")
    @PreAuthorize("hasAnyRole('LICENSING_AUTHORITY', 'ADMIN')")
    public ResponseEntity<ApiResponse<CertificateResponse>> generateFirearmCertificate(
            @PathVariable String applicationNumber,
            @AuthenticationPrincipal UserDetails userDetails) {
        CertificateResponse response = certificateService
                .generateFirearmCertificate(applicationNumber, userDetails.getUsername());
        return ResponseEntity.ok(
                ApiResponse.success("Firearm certificate generated successfully", response));
    }

    @PostMapping("/kyc/{requestNumber}")
    @PreAuthorize("hasAnyRole('POLICE_OFFICER', 'ADMIN')")
    public ResponseEntity<ApiResponse<CertificateResponse>> generateKycCertificate(
            @PathVariable String requestNumber,
            @AuthenticationPrincipal UserDetails userDetails) {
        CertificateResponse response = certificateService
                .generateKycCertificate(requestNumber, userDetails.getUsername());
        return ResponseEntity.ok(
                ApiResponse.success("KYC certificate generated successfully", response));
    }

    @GetMapping("/verify/{certificateId}")
    public ResponseEntity<ApiResponse<com.secure.policerecord.response.CertificateVerifyResponse>> verifyCertificate(
            @PathVariable String certificateId) {
        com.secure.policerecord.response.CertificateVerifyResponse response = certificateService
                .verifyCertificatePublic(certificateId);
        return ResponseEntity.ok(
                ApiResponse.success("Certificate verified successfully", response));
    }

    @PutMapping("/revoke/{certificateId}")
    @PreAuthorize("hasAnyRole('LICENSING_AUTHORITY', 'ADMIN')")
    public ResponseEntity<ApiResponse<CertificateResponse>> revokeCertificate(
            @PathVariable String certificateId,
            @RequestParam String reason,
            @AuthenticationPrincipal UserDetails userDetails) {
        CertificateResponse response = certificateService
                .revokeCertificate(certificateId, reason, userDetails.getUsername());
        return ResponseEntity.ok(
                ApiResponse.success("Certificate revoked successfully", response));
    }

    @GetMapping("/citizen/{citizenReference}")
    @PreAuthorize("hasAnyRole('CITIZEN', 'POLICE_OFFICER', 'LICENSING_AUTHORITY', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<CertificateResponse>>> getCitizenCertificates(
            @PathVariable String citizenReference) {
        List<CertificateResponse> response = certificateService
                .getCertificatesByCitizenReference(citizenReference);
        return ResponseEntity.ok(
                ApiResponse.success("Certificates retrieved successfully", response));
    }
}