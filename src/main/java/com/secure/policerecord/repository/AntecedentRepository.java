package com.secure.policerecord.repository;

import com.secure.policerecord.model.AntecedentReport;
import com.secure.policerecord.model.AntecedentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AntecedentRepository extends JpaRepository<AntecedentReport, UUID> {
    Optional<AntecedentReport> findByReportNumber(String reportNumber);
    List<AntecedentReport> findByCitizenId(UUID citizenId);
    List<AntecedentReport> findByOverallStatus(AntecedentStatus status);
    List<AntecedentReport> findByOfficerId(UUID officerId);
}