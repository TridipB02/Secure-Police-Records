package com.secure.policerecord.service;

import com.secure.policerecord.model.AuditLog;
import com.secure.policerecord.model.Role;
import com.secure.policerecord.model.User;
import com.secure.policerecord.repository.AuditLogRepository;
import com.secure.policerecord.repository.UserRepository;
import com.secure.policerecord.response.AuditLogResponse;
import com.secure.policerecord.util.CryptoUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.secure.policerecord.fabric.FabricService;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final CryptoUtil cryptoUtil;
    private final FabricService fabricService;

    @Transactional
    public void logAction(String username, String actionType,
                          String resourceType, String resourceId,
                          String details, String ipAddress) {
        try {
            User actor = userRepository.findByUsername(username).orElse(null);

            String detailsEncrypted = details != null
                    ? cryptoUtil.encrypt(details) : null;

            AuditLog log = AuditLog.builder()
                    .actor(actor)
                    .actorRole(actor != null ? actor.getRole() : Role.ADMIN)
                    .actionType(actionType)
                    .resourceType(resourceType)
                    .resourceId(resourceId)
                    .ipAddress(ipAddress)
                    .detailsEncrypted(detailsEncrypted)
                    .build();

            auditLogRepository.save(log);

            fabricService.logAuditEntry(
                    username,
                    actor != null ? actor.getRole().name() : "SYSTEM",
                    actionType,
                    resourceType,
                    resourceId != null ? resourceId : ""
            );

        } catch (Exception e) {
            // never let audit logging break the main flow
        }


    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> getAllAuditLogs() {
        return auditLogRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> getAuditTrailByResource(
            String resourceType, String resourceId) {
        return auditLogRepository
                .findByResourceTypeAndResourceId(resourceType, resourceId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> getAuditTrailByActor(String username) {
        User actor = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return auditLogRepository.findByActorId(actor.getId())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> getAuditTrailByAction(String actionType) {
        return auditLogRepository.findByActionType(actionType)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private AuditLogResponse mapToResponse(AuditLog log) {
        String details = null;
        try {
            if (log.getDetailsEncrypted() != null) {
                details = cryptoUtil.decrypt(log.getDetailsEncrypted());
            }
        } catch (Exception e) {
            details = "Unable to decrypt";
        }

        String actorName = "System";
        String actorRole = log.getActorRole().name();
        try {
            if (log.getActor() != null) {
                actorName = log.getActor().getFullName();
            }
        } catch (Exception e) {
            actorName = "System";
        }

        return AuditLogResponse.builder()
                .id(log.getId().toString())
                .actorName(actorName)
                .actorRole(actorRole)
                .actionType(log.getActionType())
                .resourceType(log.getResourceType())
                .resourceId(log.getResourceId())
                .ipAddress(log.getIpAddress())
                .details(details)
                .blockchainTxId(log.getBlockchainTxId())
                .createdAt(log.getCreatedAt() != null
                        ? log.getCreatedAt().toString()
                        : LocalDateTime.now().toString())
                .build();
    }
}