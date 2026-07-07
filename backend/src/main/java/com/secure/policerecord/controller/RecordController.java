package com.secure.policerecord.controller;

import com.secure.policerecord.request.PoliceRecordRequest;
import com.secure.policerecord.response.ApiResponse;
import com.secure.policerecord.response.PoliceRecordResponse;
import com.secure.policerecord.response.TamperCheckResponse;
import com.secure.policerecord.service.RecordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/records")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RecordController {

    private final RecordService recordService;

    @PostMapping("/create")
    @PreAuthorize("hasAnyRole('POLICE_OFFICER', 'ADMIN')")
    public ResponseEntity<ApiResponse<PoliceRecordResponse>> createRecord(
            @Valid @RequestBody PoliceRecordRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        PoliceRecordResponse response = recordService.createRecord(
                request, userDetails.getUsername());
        return ResponseEntity.ok(
                ApiResponse.success("Police record created successfully", response));
    }

    @PutMapping("/update")
    @PreAuthorize("hasAnyRole('POLICE_OFFICER', 'ADMIN')")
    public ResponseEntity<ApiResponse<PoliceRecordResponse>> updateRecord(
            @Valid @RequestBody PoliceRecordRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        PoliceRecordResponse response = recordService.updateRecord(
                request, userDetails.getUsername());
        return ResponseEntity.ok(
                ApiResponse.success("Police record updated successfully", response));
    }

    @GetMapping("/{recordId}")
    @PreAuthorize("hasAnyRole('POLICE_OFFICER', 'AUDIT_OFFICER', 'ADMIN')")
    public ResponseEntity<ApiResponse<PoliceRecordResponse>> getRecord(
            @PathVariable String recordId) {
        PoliceRecordResponse response = recordService.getLatestRecord(recordId);
        return ResponseEntity.ok(
                ApiResponse.success("Record retrieved successfully", response));
    }

    @GetMapping("/history/{recordId}")
    @PreAuthorize("hasAnyRole('POLICE_OFFICER', 'AUDIT_OFFICER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<PoliceRecordResponse>>> getRecordHistory(
            @PathVariable String recordId) {
        List<PoliceRecordResponse> response = recordService.getRecordHistory(recordId);
        return ResponseEntity.ok(
                ApiResponse.success("Record history retrieved successfully", response));
    }

    @GetMapping("/verify/{recordId}")
    @PreAuthorize("hasAnyRole('AUDIT_OFFICER', 'ADMIN')")
    public ResponseEntity<ApiResponse<TamperCheckResponse>> verifyRecord(
            @PathVariable String recordId) {
        TamperCheckResponse response = recordService.verifyRecord(recordId);
        return ResponseEntity.ok(
                ApiResponse.success("Record verification completed", response));
    }
}