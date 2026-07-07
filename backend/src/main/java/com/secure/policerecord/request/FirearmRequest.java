package com.secure.policerecord.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class FirearmRequest {

    @NotBlank(message = "Citizen reference number is required")
    private String citizenReferenceNumber;

    @NotBlank(message = "Weapon type is required")
    private String weaponType;

    @NotBlank(message = "Purpose is required")
    private String purpose;
}