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
@Table(name = "citizens")
public class Citizen {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "reference_number", nullable = false, unique = true)
    private String referenceNumber;

    @Column(name = "full_name_encrypted", nullable = false)
    private String fullNameEncrypted;

    @Column(name = "dob_encrypted", nullable = false)
    private String dobEncrypted;

    @Column(name = "address_encrypted", nullable = false)
    private String addressEncrypted;

    @Column(name = "phone_encrypted", nullable = false)
    private String phoneEncrypted;

    @Column(name = "email_encrypted", nullable = false)
    private String emailEncrypted;

    @Column(name = "id_proof_type", nullable = false)
    private String idProofType;

    @Column(name = "id_proof_number_encrypted", nullable = false)
    private String idProofNumberEncrypted;

    @Column(name = "record_hash", nullable = false)
    private String recordHash;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}