package com.secure.policerecord.fabric;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hyperledger.fabric.gateway.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

@Slf4j
@Service
@RequiredArgsConstructor
public class FabricService {

    private final Gateway fabricGateway;

    @Value("${fabric.channel-name}")
    private String channelName;

    @Value("${fabric.chaincode-name}")
    private String chaincodeName;

    private Contract getContract() {
        Network network = fabricGateway.getNetwork(channelName);
        return network.getContract(chaincodeName);
    }

    public String storeRecordHash(String recordId, String hash,
            String recordType, String officerId) {
        try {
            Contract contract = getContract();
            byte[] result = contract.submitTransaction(
                "StoreRecordHash", recordId, hash, recordType, officerId);
            String txId = extractTxId();
            log.info("StoreRecordHash txId: {}", txId);
            return txId;
        } catch (Exception e) {
            log.error("Failed to store record hash on Fabric: {}", e.getMessage());
            return null;
        }
    }

    public String getRecordHash(String recordId) {
        try {
            Contract contract = getContract();
            byte[] result = contract.evaluateTransaction("GetRecordHash", recordId);
            return new String(result, StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.error("Failed to get record hash from Fabric: {}", e.getMessage());
            return null;
        }
    }

    public String storeKycHash(String requestNumber, String citizenRef,
            String hash, String status, String officerId) {
        try {
            Contract contract = getContract();
            contract.submitTransaction(
                "StoreKycHash", requestNumber, citizenRef, hash, status, officerId);
            String txId = extractTxId();
            log.info("StoreKycHash txId: {}", txId);
            return txId;
        } catch (Exception e) {
            log.error("Failed to store KYC hash on Fabric: {}", e.getMessage());
            return null;
        }
    }

    public String getKycHash(String requestNumber) {
        try {
            Contract contract = getContract();
            byte[] result = contract.evaluateTransaction("GetKycHash", requestNumber);
            return new String(result, StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.error("Failed to get KYC hash from Fabric: {}", e.getMessage());
            return null;
        }
    }

    public String storeFirearmHash(String applicationNumber, String licenseNumber,
            String citizenRef, String weaponType,
            String hash, String status, String officerId) {
        try {
            Contract contract = getContract();
            contract.submitTransaction(
                "StoreFirearmHash", applicationNumber,
                licenseNumber != null ? licenseNumber : "",
                citizenRef, weaponType, hash, status, officerId);
            String txId = extractTxId();
            log.info("StoreFirearmHash txId: {}", txId);
            return txId;
        } catch (Exception e) {
            log.error("Failed to store firearm hash on Fabric: {}", e.getMessage());
            return null;
        }
    }

    public String getFirearmHash(String applicationNumber) {
        try {
            Contract contract = getContract();
            byte[] result = contract.evaluateTransaction(
                "GetFirearmHash", applicationNumber);
            return new String(result, StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.error("Failed to get firearm hash from Fabric: {}", e.getMessage());
            return null;
        }
    }

    public String storeAntecedentHash(String reportNumber, String citizenRef,
            String hash, String overallStatus, String officerId) {
        try {
            Contract contract = getContract();
            contract.submitTransaction(
                "StoreAntecedentHash", reportNumber,
                citizenRef, hash, overallStatus, officerId);
            String txId = extractTxId();
            log.info("StoreAntecedentHash txId: {}", txId);
            return txId;
        } catch (Exception e) {
            log.error("Failed to store antecedent hash on Fabric: {}", e.getMessage());
            return null;
        }
    }

    public String revokeFirearmLicense(String applicationNumber,
            String reason, String officerId) {
        try {
            Contract contract = getContract();
            contract.submitTransaction(
                "RevokeFirearmLicense", applicationNumber,
                reason != null ? reason : "", officerId);
            String txId = extractTxId();
            log.info("RevokeFirearmLicense txId: {}", txId);
            return txId;
        } catch (Exception e) {
            log.error("Failed to revoke firearm license on Fabric: {}", e.getMessage());
            return null;
        }
    }

    public boolean verifyRecordIntegrity(String recordId, String currentHash) {
        try {
            Contract contract = getContract();
            byte[] result = contract.evaluateTransaction(
                "VerifyRecordIntegrity", recordId, currentHash);
            return Boolean.parseBoolean(new String(result, StandardCharsets.UTF_8));
        } catch (Exception e) {
            log.error("Failed to verify record integrity on Fabric: {}", e.getMessage());
            return false;
        }
    }

    public String logAuditEntry(String actorId, String actorRole,
            String actionType, String resourceType, String resourceId) {
        try {
            Contract contract = getContract();
            contract.submitTransaction(
                "LogAuditEntry", actorId, actorRole,
                actionType, resourceType, resourceId);
            return extractTxId();
        } catch (Exception e) {
            log.error("Failed to log audit entry on Fabric: {}", e.getMessage());
            return null;
        }
    }

    private String extractTxId() {
        return "TX-" + System.currentTimeMillis();
    }
}