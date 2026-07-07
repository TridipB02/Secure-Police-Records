package com.secure.policerecord.repository;

import com.secure.policerecord.model.FirearmApplication;
import com.secure.policerecord.model.FirearmStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FirearmRepository extends JpaRepository<FirearmApplication, UUID> {
    Optional<FirearmApplication> findByApplicationNumber(String applicationNumber);
    Optional<FirearmApplication> findByLicenseNumber(String licenseNumber);
    List<FirearmApplication> findByCitizenId(UUID citizenId);
    List<FirearmApplication> findByStatus(FirearmStatus status);
    List<FirearmApplication> findByAssignedOfficerId(UUID officerId);
    List<FirearmApplication> findByLicensingAuthorityId(UUID authorityId);
}