package com.secure.policerecord.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AntecedentReportResponse {
    private String id;
    private String reportNumber;
    private String citizenName;
    private String citizenReference;
    private String officerName;
    private String convictionStatus;
    private Integer pendingCases;
    private Boolean blacklistFlag;
    private String overallStatus;
    private String reportHash;
    private String blockchainTxId;
    private String submittedAt;
}