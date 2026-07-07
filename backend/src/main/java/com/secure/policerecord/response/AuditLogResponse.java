package com.secure.policerecord.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogResponse {
    private String id;
    private String actorName;
    private String actorRole;
    private String actionType;
    private String resourceType;
    private String resourceId;
    private String ipAddress;
    private String details;
    private String blockchainTxId;
    private String createdAt;
}