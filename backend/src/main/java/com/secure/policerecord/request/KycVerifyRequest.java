package com.secure.policerecord.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class KycVerifyRequest {

    @NotBlank(message = "Request number is required")
    private String requestNumber;

    @NotBlank(message = "Status is required")
    private String status;

    private String remarks;
}