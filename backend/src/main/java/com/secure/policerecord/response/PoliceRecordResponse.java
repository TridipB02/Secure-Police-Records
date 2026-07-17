package com.secure.policerecord.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PoliceRecordResponse {
    private String id;
    private String recordId;
    private Integer version;
    private String recordType;
    private String content;
    private String citizenName;
    private String citizenReference;
    private String previousHash;
    private String currentHash;
    private String actionType;
    private String officerName;
    private String blockchainTxId;
    private String createdAt;
}