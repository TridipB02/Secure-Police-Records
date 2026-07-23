package com.secure.policerecord.controller;

import com.secure.policerecord.request.LoginRequest;
import com.secure.policerecord.request.RegisterCitizenRequest;
import com.secure.policerecord.request.RegisterRequest;
import com.secure.policerecord.response.ApiResponse;
import com.secure.policerecord.response.AuthResponse;
import com.secure.policerecord.response.UserResponse;
import com.secure.policerecord.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(
                ApiResponse.success("Login successful", response));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(
                ApiResponse.success("Registration successful", response));
    }

    @PostMapping("/register-citizen")
    public ResponseEntity<ApiResponse<AuthResponse>> registerCitizen(
            @Valid @RequestBody RegisterCitizenRequest request) {
        AuthResponse response = authService.registerCitizenSelf(request);
        return ResponseEntity.ok(
                ApiResponse.success("Citizen registration successful", response));
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers() {
        List<UserResponse> response = authService.getAllUsers();
        return ResponseEntity.ok(
                ApiResponse.success("Users retrieved successfully", response));
    }

    @DeleteMapping("/users/{username}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteUser(
            @PathVariable String username,
            @AuthenticationPrincipal UserDetails userDetails) {
        authService.deleteUser(username, userDetails.getUsername());
        return ResponseEntity.ok(
                ApiResponse.success("User deleted successfully", null));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @AuthenticationPrincipal UserDetails userDetails) {
        authService.logout(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Logged out successfully", null));
    }
}