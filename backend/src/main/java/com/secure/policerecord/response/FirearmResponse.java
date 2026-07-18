package com.secure.policerecord.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FirearmResponse {
    private String id;
    private String applicationNumber;
    private String citizenName;
    private String citizenReference;
    private String weaponType;
    private String status;
    private String licenseNumber;
    private String issueDate;
    private String expiryDate;
    private String blockchainTxId;
    private Boolean biometricVerified;
    private String createdAt;
}