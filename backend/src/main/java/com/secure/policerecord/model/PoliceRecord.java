package com.secure.policerecord.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "police_records")
public class PoliceRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "record_id", nullable = false)
    private String recordId;

    @Column(nullable = false)
    private Integer version;

    @Column(name = "record_type", nullable = false)
    private String recordType;

    @Column(name = "content_encrypted", nullable = false)
    private String contentEncrypted;

    @Column(name = "previous_hash")
    private String previousHash;

    @Column(name = "current_hash", nullable = false)
    private String currentHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", nullable = false)
    private RecordAction actionType;

    @Column(name = "action_reason_encrypted")
    private String actionReasonEncrypted;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "officer_id")
    private User officer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "citizen_id")
    private Citizen citizen;

    @Column(name = "digital_signature")
    private String digitalSignature;

    @Column(name = "blockchain_tx_id")
    private String blockchainTxId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}