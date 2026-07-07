package com.secure.policerecord.controller;

import com.secure.policerecord.response.ApiResponse;
import com.secure.policerecord.response.AuditLogResponse;
import com.secure.policerecord.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuditController {

    private final AuditService auditService;

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('AUDIT_OFFICER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<AuditLogResponse>>> getAllLogs() {
        List<AuditLogResponse> response = auditService.getAllAuditLogs();
        return ResponseEntity.ok(
                ApiResponse.success("Audit logs retrieved", response));
    }

    @GetMapping("/resource/{resourceType}/{resourceId}")
    @PreAuthorize("hasAnyRole('AUDIT_OFFICER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<AuditLogResponse>>> getByResource(
            @PathVariable String resourceType,
            @PathVariable String resourceId) {
        List<AuditLogResponse> response = auditService
                .getAuditTrailByResource(resourceType, resourceId);
        return ResponseEntity.ok(
                ApiResponse.success("Audit trail retrieved", response));
    }

    @GetMapping("/actor")
    @PreAuthorize("hasAnyRole('AUDIT_OFFICER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<AuditLogResponse>>> getByActor(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<AuditLogResponse> response = auditService
                .getAuditTrailByActor(userDetails.getUsername());
        return ResponseEntity.ok(
                ApiResponse.success("Actor audit trail retrieved", response));
    }

    @GetMapping("/action/{actionType}")
    @PreAuthorize("hasAnyRole('AUDIT_OFFICER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<AuditLogResponse>>> getByAction(
            @PathVariable String actionType) {
        List<AuditLogResponse> response = auditService
                .getAuditTrailByAction(actionType);
        return ResponseEntity.ok(
                ApiResponse.success("Action audit trail retrieved", response));
    }
}