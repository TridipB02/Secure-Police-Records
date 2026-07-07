package com.secure.policerecord.repository;

import com.secure.policerecord.model.KycRequest;
import com.secure.policerecord.model.KycStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface KycRepository extends JpaRepository<KycRequest, UUID> {
    Optional<KycRequest> findByRequestNumber(String requestNumber);
    List<KycRequest> findByStatus(KycStatus status);
    List<KycRequest> findByCitizenId(UUID citizenId);
    List<KycRequest> findByAssignedOfficerId(UUID officerId);
}