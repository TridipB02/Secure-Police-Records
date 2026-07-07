package com.secure.policerecord.util;

import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

@Component
public class HashUtil {

    public String generateSHA256(String data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(data.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not found", e);
        }
    }

    public boolean verifyHash(String data, String expectedHash) {
        return generateSHA256(data).equals(expectedHash);
    }

    public String generateRecordHash(String recordId, String content, String previousHash) {
        String combined = recordId + content + (previousHash != null ? previousHash : "GENESIS");
        return generateSHA256(combined);
    }
}