package com.secure.policerecord.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CitizenResponse {
    private String id;
    private String referenceNumber;
    private String fullName;
    private String dateOfBirth;
    private String address;
    private String phone;
    private String email;
    private String idProofType;
    private String idProofNumber;
    private String createdAt;
}