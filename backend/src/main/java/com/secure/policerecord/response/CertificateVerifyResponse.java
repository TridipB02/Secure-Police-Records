package com.secure.policerecord.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CertificateVerifyResponse {
    private String certificateId;
    private String certificateType;
    private String status;
    private String issueDate;
    private String expiryDate;
    private String documentHash;
    private String blockchainTxId;
    private String revokedAt;
    private String revocationReason;
}