package com.secure.policerecord.util;

import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Component
public class ReferenceGenerator {

    private static final DateTimeFormatter FORMATTER =
            DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    public String generateKycNumber() {
        return "KYC-" + LocalDateTime.now().format(FORMATTER) +
                "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }

    public String generateCitizenReference() {
        return "CIT-" + LocalDateTime.now().format(FORMATTER) +
                "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }

    public String generateAntecedentNumber() {
        return "ANT-" + LocalDateTime.now().format(FORMATTER) +
                "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }

    public String generateFirearmNumber() {
        return "FA-" + LocalDateTime.now().format(FORMATTER) +
                "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }

    public String generateLicenseNumber() {
        return "LIC-" + LocalDateTime.now().format(FORMATTER) +
                "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }

    public String generateCertificateId() {
        return "CERT-" + LocalDateTime.now().format(FORMATTER) +
                "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }

    public String generateRecordId() {
        return "REC-" + LocalDateTime.now().format(FORMATTER) +
                "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }
}