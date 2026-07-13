package com.secure.policerecord.controller;

import com.secure.policerecord.request.AntecedentRequest;
import com.secure.policerecord.response.AntecedentReportResponse;
import com.secure.policerecord.response.ApiResponse;
import com.secure.policerecord.service.AntecedentService;
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
@RequestMapping("/api/antecedent")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AntecedentController {

    private final AntecedentService antecedentService;

    @PostMapping("/submit")
    @PreAuthorize("hasAnyRole('ANTECEDENT_OFFICER', 'ADMIN')")
    public ResponseEntity<ApiResponse<AntecedentReportResponse>> submitReport(
            @Valid @RequestBody AntecedentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        AntecedentReportResponse response = antecedentService
                .submitAntecedentReport(request, userDetails.getUsername());
        return ResponseEntity.ok(
                ApiResponse.success("Antecedent report submitted successfully", response));
    }

    @GetMapping("/{reportNumber}")
    @PreAuthorize("hasAnyRole('ANTECEDENT_OFFICER', 'ADMIN', 'LICENSING_AUTHORITY')")
    public ResponseEntity<ApiResponse<AntecedentReportResponse>> getReport(
            @PathVariable String reportNumber) {
        AntecedentReportResponse response = antecedentService
                .getReportByNumber(reportNumber);
        return ResponseEntity.ok(
                ApiResponse.success("Report retrieved successfully", response));
    }

    @GetMapping("/citizen/{citizenReference}")
    @PreAuthorize("hasAnyRole('ANTECEDENT_OFFICER', 'ADMIN', 'LICENSING_AUTHORITY')")
    public ResponseEntity<ApiResponse<List<AntecedentReportResponse>>> getCitizenReports(
            @PathVariable String citizenReference) {
        List<AntecedentReportResponse> response = antecedentService
                .getReportsByCitizenReference(citizenReference);
        return ResponseEntity.ok(
                ApiResponse.success("Citizen reports retrieved successfully", response));
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('ANTECEDENT_OFFICER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<AntecedentReportResponse>>> getReportsByStatus(
            @PathVariable String status) {
        List<AntecedentReportResponse> response = antecedentService
                .getReportsByStatus(status);
        return ResponseEntity.ok(
                ApiResponse.success("Reports retrieved successfully", response));
    }

    @GetMapping("/officer")
    @PreAuthorize("hasAnyRole('ANTECEDENT_OFFICER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<AntecedentReportResponse>>> getOfficerReports(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<AntecedentReportResponse> response = antecedentService
                .getReportsByOfficer(userDetails.getUsername());
        return ResponseEntity.ok(
                ApiResponse.success("Officer reports retrieved successfully", response));
    }
}