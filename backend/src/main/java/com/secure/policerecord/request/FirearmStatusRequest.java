package com.secure.policerecord.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class FirearmStatusRequest {

    @NotBlank(message = "Application number is required")
    private String applicationNumber;

    @NotBlank(message = "Status is required")
    private String status;

    private String reason;
}