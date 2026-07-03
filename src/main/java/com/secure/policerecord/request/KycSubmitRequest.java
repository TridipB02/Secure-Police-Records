package com.secure.policerecord.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class KycSubmitRequest {

    @NotBlank(message = "Citizen reference number is required")
    private String citizenReferenceNumber;
}