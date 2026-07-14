package com.secure.policerecord.controller;

import com.secure.policerecord.request.KycSubmitRequest;
import com.secure.policerecord.request.KycVerifyRequest;
import com.secure.policerecord.response.ApiResponse;
import com.secure.policerecord.response.KycResponse;
import com.secure.policerecord.service.KycService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/kyc")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class KycController {

    private final KycService kycService;

    @PostMapping("/submit")
    @PreAuthorize("hasAnyRole('CITIZEN', 'ADMIN')")
    public ResponseEntity<ApiResponse<KycResponse>> submitKyc(
            @Valid @RequestBody KycSubmitRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        KycResponse response = kycService.submitKycRequest(request, userDetails.getUsername());
        return ResponseEntity.ok(
                ApiResponse.success("KYC request submitted successfully", response));
    }

    @PutMapping("/verify")
    @PreAuthorize("hasAnyRole('POLICE_OFFICER', 'ADMIN')")
    public ResponseEntity<ApiResponse<KycResponse>> verifyKyc(
            @Valid @RequestBody KycVerifyRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        KycResponse response = kycService.verifyKycRequest(
                request, userDetails.getUsername());
        return ResponseEntity.ok(
                ApiResponse.success("KYC request verified successfully", response));
    }

    @GetMapping("/status/{requestNumber}")
    @PreAuthorize("hasAnyRole('CITIZEN', 'POLICE_OFFICER', 'ADMIN')")
    public ResponseEntity<ApiResponse<KycResponse>> getKycStatus(
            @PathVariable String requestNumber) {
        KycResponse response = kycService.getKycStatus(requestNumber);
        return ResponseEntity.ok(
                ApiResponse.success("KYC status retrieved", response));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('POLICE_OFFICER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<KycResponse>>> getPendingKyc() {
        List<KycResponse> response = kycService.getPendingKycRequests();
        return ResponseEntity.ok(
                ApiResponse.success("Pending KYC requests retrieved", response));
    }

    @GetMapping("/officer")
    @PreAuthorize("hasAnyRole('POLICE_OFFICER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<KycResponse>>> getOfficerKyc(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<KycResponse> response = kycService.getKycRequestsByOfficer(
                userDetails.getUsername());
        return ResponseEntity.ok(
                ApiResponse.success("Officer KYC requests retrieved", response));
    }

    @GetMapping("/citizen/{citizenId}")
    @PreAuthorize("hasAnyRole('CITIZEN', 'POLICE_OFFICER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<KycResponse>>> getCitizenKyc(
            @PathVariable UUID citizenId) {
        List<KycResponse> response = kycService.getKycRequestsByCitizen(citizenId);
        return ResponseEntity.ok(
                ApiResponse.success("Citizen KYC requests retrieved", response));
    }
}