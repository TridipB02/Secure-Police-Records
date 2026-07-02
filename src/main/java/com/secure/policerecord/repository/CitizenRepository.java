package com.secure.policerecord.repository;

import com.secure.policerecord.model.Citizen;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CitizenRepository extends JpaRepository<Citizen, UUID> {
    Optional<Citizen> findByReferenceNumber(String referenceNumber);
    boolean existsByReferenceNumber(String referenceNumber);
}