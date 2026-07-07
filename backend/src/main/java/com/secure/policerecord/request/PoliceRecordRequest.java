package com.secure.policerecord.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PoliceRecordRequest {

    @NotBlank(message = "Record type is required")
    private String recordType;

    @NotBlank(message = "Content is required")
    private String content;

    private String actionReason;
    private String existingRecordId;
}