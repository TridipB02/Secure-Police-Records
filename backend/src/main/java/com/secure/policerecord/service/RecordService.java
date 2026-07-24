package com.secure.policerecord.service;

import com.secure.policerecord.exception.BadRequestException;
import com.secure.policerecord.exception.ResourceNotFoundException;
import com.secure.policerecord.model.Citizen;
import com.secure.policerecord.model.PoliceRecord;
import com.secure.policerecord.model.RecordAction;
import com.secure.policerecord.model.User;
import com.secure.policerecord.repository.CitizenRepository;
import com.secure.policerecord.repository.PoliceRecordRepository;
import com.secure.policerecord.repository.UserRepository;
import com.secure.policerecord.request.PoliceRecordRequest;
import com.secure.policerecord.response.PoliceRecordResponse;
import com.secure.policerecord.response.TamperCheckResponse;
import com.secure.policerecord.util.CryptoUtil;
import com.secure.policerecord.util.HashUtil;
import com.secure.policerecord.util.ReferenceGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.secure.policerecord.fabric.FabricService;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecordService {

    private final PoliceRecordRepository policeRecordRepository;
    private final UserRepository userRepository;
    private final CryptoUtil cryptoUtil;
    private final HashUtil hashUtil;
    private final ReferenceGenerator referenceGenerator;
    private final AuditService auditService;
    private final FabricService fabricService;
    private final CitizenRepository citizenRepository;

    @Transactional
    public PoliceRecordResponse createRecord(PoliceRecordRequest request,
                                             String officerUsername) {
        User officer = userRepository.findByUsername(officerUsername)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Officer not found: " + officerUsername));

        if (request.getCitizenReferenceNumber() == null || request.getCitizenReferenceNumber().isBlank()) {
            throw new BadRequestException(
                    "A citizen reference number is required to create a police record");
        }
        Citizen citizen = citizenRepository.findByReferenceNumber(request.getCitizenReferenceNumber())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Citizen not found: " + request.getCitizenReferenceNumber()));

        String recordId = referenceGenerator.generateRecordId();
        String contentEncrypted = cryptoUtil.encrypt(request.getContent());
        String currentHash = hashUtil.generateRecordHash(
                recordId, request.getContent(), null);

        String actionReasonEncrypted = request.getActionReason() != null
                ? cryptoUtil.encrypt(request.getActionReason()) : null;

        PoliceRecord record = PoliceRecord.builder()
                .recordId(recordId)
                .version(1)
                .recordType(request.getRecordType())
                .contentEncrypted(contentEncrypted)
                .previousHash(null)
                .currentHash(currentHash)
                .actionType(RecordAction.CREATE)
                .actionReasonEncrypted(actionReasonEncrypted)
                .officer(officer)
                .citizen(citizen)
                .build();

        policeRecordRepository.save(record);

        auditService.logAction(
                officerUsername, "RECORD_CREATED", "POLICE_RECORD",
                recordId,
                "Police record created: " + request.getRecordType(),
                null
        );

        String txId = fabricService.storeRecordHash(
                recordId,
                currentHash,
                request.getRecordType(),
                officerUsername
        );
        if (txId != null) {
                record.setBlockchainTxId(txId);
                policeRecordRepository.save(record);
        }

        return mapToResponse(record, request.getContent());
    }

    @Transactional
    public PoliceRecordResponse updateRecord(PoliceRecordRequest request,
                                             String officerUsername) {
        User officer = userRepository.findByUsername(officerUsername)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Officer not found: " + officerUsername));

        PoliceRecord latest = policeRecordRepository
                .findTopByRecordIdOrderByVersionDesc(request.getExistingRecordId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Record not found: " + request.getExistingRecordId()));

        String previousHash = latest.getCurrentHash();
        String contentEncrypted = cryptoUtil.encrypt(request.getContent());
        String currentHash = hashUtil.generateRecordHash(
                request.getExistingRecordId(), request.getContent(), previousHash);

        String actionReasonEncrypted = request.getActionReason() != null
                ? cryptoUtil.encrypt(request.getActionReason()) : null;

        PoliceRecord updatedRecord = PoliceRecord.builder()
                .recordId(request.getExistingRecordId())
                .version(latest.getVersion() + 1)
                .recordType(request.getRecordType())
                .contentEncrypted(contentEncrypted)
                .previousHash(previousHash)
                .currentHash(currentHash)
                .actionType(RecordAction.UPDATE)
                .actionReasonEncrypted(actionReasonEncrypted)
                .officer(officer)
                .citizen(latest.getCitizen())
                .build();

        policeRecordRepository.save(updatedRecord);

        auditService.logAction(
                officerUsername, "RECORD_UPDATED", "POLICE_RECORD",
                request.getExistingRecordId(),
                "Police record updated to version: " + (latest.getVersion() + 1),
                null
        );

        String txId = fabricService.storeRecordHash(
                request.getExistingRecordId(),
                currentHash,
                request.getRecordType(),
                officerUsername
        );
        if (txId != null) {
                updatedRecord.setBlockchainTxId(txId);
                policeRecordRepository.save(updatedRecord);
        }

        return mapToResponse(updatedRecord, request.getContent());
    }

    @Transactional(readOnly = true)
    public PoliceRecordResponse getLatestRecord(String recordId) {
        PoliceRecord record = policeRecordRepository
                .findTopByRecordIdOrderByVersionDesc(recordId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Record not found: " + recordId));
        String content = cryptoUtil.decrypt(record.getContentEncrypted());
        return mapToResponse(record, content);
    }

    @Transactional(readOnly = true)
    public List<PoliceRecordResponse> getRecordHistory(String recordId) {
        List<PoliceRecord> records = policeRecordRepository
                .findByRecordIdOrderByVersionDesc(recordId);
        if (records.isEmpty()) {
            throw new ResourceNotFoundException("Record not found: " + recordId);
        }
        return records.stream()
                .map(r -> mapToResponse(r, cryptoUtil.decrypt(r.getContentEncrypted())))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PoliceRecordResponse> getRecordsByCitizenReference(String citizenReference) {
        Citizen citizen = citizenRepository.findByReferenceNumber(citizenReference)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Citizen not found: " + citizenReference));
        return policeRecordRepository.findByCitizenIdOrderByCreatedAtDesc(citizen.getId())
                .stream()
                .map(r -> mapToResponse(r, cryptoUtil.decrypt(r.getContentEncrypted())))
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public TamperCheckResponse verifyRecord(String recordId) {
        PoliceRecord latest = policeRecordRepository
                .findTopByRecordIdOrderByVersionDesc(recordId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Record not found: " + recordId));

        boolean tampered = false;
        String status = "INTACT";

        try {
            String decryptedContent = cryptoUtil.decrypt(latest.getContentEncrypted());
            String recalculatedHash = hashUtil.generateRecordHash(
                    recordId, decryptedContent, latest.getPreviousHash());
            tampered = !recalculatedHash.equals(latest.getCurrentHash());
            status = tampered ? "TAMPERED" : "INTACT";
        } catch (Exception e) {
            tampered = true;
            status = "TAMPERED - Content decryption failed, data corrupted";
        }

        boolean fabricVerified = false;
        String blockchainHash = "Not anchored yet";

        if (latest.getBlockchainTxId() != null) {
            fabricVerified = fabricService.verifyRecordIntegrity(
                    recordId, latest.getCurrentHash());
            blockchainHash = latest.getBlockchainTxId();
        }

        return TamperCheckResponse.builder()
                .recordId(recordId)
                .status(tampered ? "TAMPERED" : "INTACT")
                .dbHash(latest.getCurrentHash())
                .blockchainHash(blockchainHash)
                .tampered(tampered)
                .checkedAt(LocalDateTime.now().toString())
                .build();
    }

    @Transactional(readOnly = true)
    public List<PoliceRecordResponse> getAllRecords() {
        return policeRecordRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(r -> mapToResponse(r, cryptoUtil.decrypt(r.getContentEncrypted())))
                .collect(Collectors.toList());
    }

    private PoliceRecordResponse mapToResponse(PoliceRecord record, String content) {
        String citizenName = null;
        String citizenReference = null;
        if (record.getCitizen() != null) {
            try {
                citizenName = cryptoUtil.decrypt(record.getCitizen().getFullNameEncrypted());
                citizenReference = record.getCitizen().getReferenceNumber();
            } catch (Exception e) {
                citizenName = null;
                citizenReference = record.getCitizen().getReferenceNumber();
            }
        }

        return PoliceRecordResponse.builder()
                .id(record.getId().toString())
                .recordId(record.getRecordId())
                .version(record.getVersion())
                .recordType(record.getRecordType())
                .content(content)
                .citizenName(citizenName)
                .citizenReference(citizenReference)
                .previousHash(record.getPreviousHash())
                .currentHash(record.getCurrentHash())
                .actionType(record.getActionType().name())
                .officerName(record.getOfficer() != null
                        ? record.getOfficer().getFullName() : "Unknown")
                .blockchainTxId(record.getBlockchainTxId())
                .createdAt(record.getCreatedAt() != null
                        ? record.getCreatedAt().toString()
                        : LocalDateTime.now().toString())
                .build();
    }
}