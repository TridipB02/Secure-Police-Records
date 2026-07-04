package com.secure.policerecord.controller;

import com.secure.policerecord.request.FirearmRequest;
import com.secure.policerecord.request.FirearmStatusRequest;
import com.secure.policerecord.response.ApiResponse;
import com.secure.policerecord.response.FirearmResponse;
import com.secure.policerecord.service.FirearmService;
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
@RequestMapping("/api/firearm")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FirearmController {

    private final FirearmService firearmService;

    @PostMapping("/apply")
    @PreAuthorize("hasAnyRole('CITIZEN', 'ADMIN')")
    public ResponseEntity<ApiResponse<FirearmResponse>> applyForLicense(
            @Valid @RequestBody FirearmRequest request) {
        FirearmResponse response = firearmService.applyForLicense(request);
        return ResponseEntity.ok(
                ApiResponse.success("Firearm license application submitted", response));
    }

    @PutMapping("/status")
    @PreAuthorize("hasAnyRole('POLICE_OFFICER', 'LICENSING_AUTHORITY', 'ADMIN')")
    public ResponseEntity<ApiResponse<FirearmResponse>> updateStatus(
            @Valid @RequestBody FirearmStatusRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        FirearmResponse response = firearmService.updateStatus(
                request, userDetails.getUsername());
        return ResponseEntity.ok(
                ApiResponse.success("Application status updated successfully", response));
    }

    @GetMapping("/application/{applicationNumber}")
    @PreAuthorize("hasAnyRole('CITIZEN', 'POLICE_OFFICER', 'LICENSING_AUTHORITY', 'ADMIN')")
    public ResponseEntity<ApiResponse<FirearmResponse>> getApplication(
            @PathVariable String applicationNumber) {
        FirearmResponse response = firearmService
                .getApplicationByNumber(applicationNumber);
        return ResponseEntity.ok(
                ApiResponse.success("Application retrieved successfully", response));
    }

    @GetMapping("/license/{licenseNumber}")
    @PreAuthorize("hasAnyRole('CITIZEN', 'POLICE_OFFICER', 'LICENSING_AUTHORITY', 'ADMIN')")
    public ResponseEntity<ApiResponse<FirearmResponse>> getLicense(
            @PathVariable String licenseNumber) {
        FirearmResponse response = firearmService.getLicenseByNumber(licenseNumber);
        return ResponseEntity.ok(
                ApiResponse.success("License retrieved successfully", response));
    }

    @GetMapping("/citizen/{citizenId}")
    @PreAuthorize("hasAnyRole('CITIZEN', 'POLICE_OFFICER', 'LICENSING_AUTHORITY', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<FirearmResponse>>> getCitizenApplications(
            @PathVariable UUID citizenId) {
        List<FirearmResponse> response = firearmService
                .getApplicationsByCitizen(citizenId);
        return ResponseEntity.ok(
                ApiResponse.success("Citizen applications retrieved", response));
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('POLICE_OFFICER', 'LICENSING_AUTHORITY', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<FirearmResponse>>> getByStatus(
            @PathVariable String status) {
        List<FirearmResponse> response = firearmService.getApplicationsByStatus(status);
        return ResponseEntity.ok(
                ApiResponse.success("Applications retrieved successfully", response));
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('LICENSING_AUTHORITY', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<FirearmResponse>>> getAllApplications() {
        List<FirearmResponse> response = firearmService.getAllApplications();
        return ResponseEntity.ok(
                ApiResponse.success("All applications retrieved", response));
    }
}