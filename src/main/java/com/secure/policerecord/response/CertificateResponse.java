package com.secure.policerecord.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CertificateResponse {
    private String id;
    private String certificateId;
    private String certificateType;
    private String citizenReference;
    private String status;
    private String issuedBy;
    private String issueDate;
    private String expiryDate;
    private String qrCodeBase64;
    private String documentHash;
    private String blockchainTxId;
    private String revokedAt;
    private String revocationReason;
}