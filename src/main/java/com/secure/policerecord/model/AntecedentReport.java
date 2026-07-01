package com.secure.policerecord.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "antecedent_reports")
public class AntecedentReport {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "report_number", nullable = false, unique = true)
    private String reportNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "citizen_id", nullable = false)
    private Citizen citizen;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "officer_id")
    private User officer;

    @Column(name = "fir_history_encrypted")
    private String firHistoryEncrypted;

    @Column(name = "conviction_status")
    private String convictionStatus;

    @Column(name = "pending_cases")
    private Integer pendingCases = 0;

    @Column(name = "blacklist_flag")
    private Boolean blacklistFlag = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "overall_status", nullable = false)
    private AntecedentStatus overallStatus;

    @Column(name = "report_hash")
    private String reportHash;

    @Column(name = "blockchain_tx_id")
    private String blockchainTxId;

    @Column(name = "digital_signature")
    private String digitalSignature;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}