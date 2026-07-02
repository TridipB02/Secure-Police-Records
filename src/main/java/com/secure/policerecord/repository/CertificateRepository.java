package com.secure.policerecord.repository;

import com.secure.policerecord.model.Certificate;
import com.secure.policerecord.model.CertificateStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CertificateRepository extends JpaRepository<Certificate, UUID> {
    Optional<Certificate> findByCertificateId(String certificateId);
    List<Certificate> findByCitizenId(UUID citizenId);
    List<Certificate> findByStatus(CertificateStatus status);
}