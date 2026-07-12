package com.secure.policerecord.controller;

import com.secure.policerecord.request.CitizenRequest;
import com.secure.policerecord.response.ApiResponse;
import com.secure.policerecord.response.CitizenResponse;
import com.secure.policerecord.service.CitizenService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.secure.policerecord.exception.ResourceNotFoundException;
import com.secure.policerecord.model.User;
import com.secure.policerecord.repository.UserRepository;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import java.util.List;

@RestController
@RequestMapping("/api/citizens")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CitizenController {

    private final CitizenService citizenService;
    private final UserRepository userRepository;
    
    @PostMapping("/register")
    @PreAuthorize("hasAnyRole('ADMIN', 'POLICE_OFFICER')")
    public ResponseEntity<ApiResponse<CitizenResponse>> registerCitizen(
            @Valid @RequestBody CitizenRequest request) {
        CitizenResponse response = citizenService.registerCitizen(request);
        return ResponseEntity.ok(
                ApiResponse.success("Citizen registered successfully", response));
    }

    @GetMapping("/{referenceNumber}")
    @PreAuthorize("hasAnyRole('ADMIN', 'POLICE_OFFICER', 'ANTECEDENT_OFFICER', 'LICENSING_AUTHORITY')")
    public ResponseEntity<ApiResponse<CitizenResponse>> getCitizen(
            @PathVariable String referenceNumber) {
        CitizenResponse response = citizenService.getCitizenByReference(referenceNumber);
        return ResponseEntity.ok(
                ApiResponse.success("Citizen retrieved successfully", response));
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'POLICE_OFFICER', 'ANTECEDENT_OFFICER', 'LICENSING_AUTHORITY')")
    public ResponseEntity<ApiResponse<List<CitizenResponse>>> getAllCitizens() {
        List<CitizenResponse> response = citizenService.getAllCitizens();
        return ResponseEntity.ok(
                ApiResponse.success("All citizens retrieved", response));
    }

    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('CITIZEN', 'ADMIN')")
    public ResponseEntity<ApiResponse<CitizenResponse>> getMyCitizenProfile(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.getCitizenReferenceNumber() == null) {
            throw new ResourceNotFoundException("No citizen profile linked to this account");
        }
        CitizenResponse response = citizenService
                .getCitizenByReference(user.getCitizenReferenceNumber());
        return ResponseEntity.ok(
                ApiResponse.success("Citizen profile retrieved", response));
    }
}