package com.secure.policerecord.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private String username;
    private String fullName;
    private String email;
    private String role;
    private String badgeNumber;
    private String stationCode;
    private String citizenReferenceNumber;
    private String createdAt;
}