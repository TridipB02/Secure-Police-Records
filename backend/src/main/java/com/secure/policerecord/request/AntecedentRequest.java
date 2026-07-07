package com.secure.policerecord.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AntecedentRequest {

    @NotBlank(message = "Citizen reference number is required")
    private String citizenReferenceNumber;

    private String firHistory;
    private String convictionStatus;
    private Integer pendingCases;
    private Boolean blacklistFlag;

    @NotBlank(message = "Overall status is required")
    private String overallStatus;
}