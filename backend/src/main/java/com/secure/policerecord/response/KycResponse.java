package com.secure.policerecord.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KycResponse {
    private String id;
    private String requestNumber;
    private String citizenName;
    private String citizenReference;
    private String status;
    private String assignedOfficer;
    private String blockchainTxId;
    private String submittedAt;
    private String verifiedAt;
}