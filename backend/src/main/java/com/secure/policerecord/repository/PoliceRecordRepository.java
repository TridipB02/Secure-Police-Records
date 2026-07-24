package com.secure.policerecord.repository;

import com.secure.policerecord.model.PoliceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PoliceRecordRepository extends JpaRepository<PoliceRecord, UUID> {
    List<PoliceRecord> findByRecordIdOrderByVersionDesc(String recordId);
    Optional<PoliceRecord> findTopByRecordIdOrderByVersionDesc(String recordId);
    List<PoliceRecord> findByOfficerId(UUID officerId);
    List<PoliceRecord> findByCitizenIdOrderByCreatedAtDesc(UUID citizenId);
    List<PoliceRecord> findAllByOrderByCreatedAtDesc();
}