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
@Table(name = "firearm_applications")
public class FirearmApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "application_number", nullable = false, unique = true)
    private String applicationNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "citizen_id", nullable = false)
    private Citizen citizen;

    @Column(name = "weapon_type", nullable = false)
    private String weaponType;

    @Column(name = "purpose_encrypted", nullable = false)
    private String purposeEncrypted;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kyc_request_id")
    private KycRequest kycRequest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "antecedent_report_id")
    private AntecedentReport antecedentReport;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_officer_id")
    private User assignedOfficer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "licensing_authority_id")
    private User licensingAuthority;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FirearmStatus status;

    @Column(name = "rejection_reason_encrypted")
    private String rejectionReasonEncrypted;

    @Column(name = "revocation_reason_encrypted")
    private String revocationReasonEncrypted;

    @Column(name = "license_number")
    private String licenseNumber;

    @Column(name = "issue_date")
    private LocalDateTime issueDate;

    @Column(name = "expiry_date")
    private LocalDateTime expiryDate;

    @Column(name = "revoked_at")
    private LocalDateTime revokedAt;

    @Column(name = "report_hash")
    private String reportHash;

    @Column(name = "blockchain_tx_id")
    private String blockchainTxId;

    @Column(name = "certificate_qr_path")
    private String certificateQrPath;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}