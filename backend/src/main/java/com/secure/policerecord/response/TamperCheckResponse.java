package com.secure.policerecord.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TamperCheckResponse {
    private String recordId;
    private String status;
    private String dbHash;
    private String blockchainHash;
    private boolean tampered;
    private String checkedAt;
}