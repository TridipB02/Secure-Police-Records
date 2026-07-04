package com.secure.policerecord.service;

import com.secure.policerecord.exception.BadRequestException;
import com.secure.policerecord.model.Citizen;
import com.secure.policerecord.repository.CitizenRepository;
import com.secure.policerecord.request.CitizenRequest;
import com.secure.policerecord.response.CitizenResponse;
import com.secure.policerecord.util.CryptoUtil;
import com.secure.policerecord.util.HashUtil;
import com.secure.policerecord.util.ReferenceGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CitizenService {

    private final CitizenRepository citizenRepository;
    private final CryptoUtil cryptoUtil;
    private final HashUtil hashUtil;
    private final ReferenceGenerator referenceGenerator;

    @Transactional
    public CitizenResponse registerCitizen(CitizenRequest request) {
        String referenceNumber = referenceGenerator.generateCitizenReference();

        String fullNameEncrypted = cryptoUtil.encrypt(request.getFullName());
        String dobEncrypted = cryptoUtil.encrypt(request.getDateOfBirth());
        String addressEncrypted = cryptoUtil.encrypt(request.getAddress());
        String phoneEncrypted = cryptoUtil.encrypt(request.getPhone());
        String emailEncrypted = cryptoUtil.encrypt(request.getEmail());
        String idProofEncrypted = cryptoUtil.encrypt(request.getIdProofNumber());

        String recordData = referenceNumber + request.getFullName()
                + request.getDateOfBirth() + request.getPhone();
        String recordHash = hashUtil.generateSHA256(recordData);

        Citizen citizen = Citizen.builder()
                .referenceNumber(referenceNumber)
                .fullNameEncrypted(fullNameEncrypted)
                .dobEncrypted(dobEncrypted)
                .addressEncrypted(addressEncrypted)
                .phoneEncrypted(phoneEncrypted)
                .emailEncrypted(emailEncrypted)
                .idProofType(request.getIdProofType())
                .idProofNumberEncrypted(idProofEncrypted)
                .recordHash(recordHash)
                .build();

        citizenRepository.save(citizen);

        return mapToResponse(citizen, request);
    }

    public CitizenResponse getCitizenByReference(String referenceNumber) {
        Citizen citizen = citizenRepository
                .findByReferenceNumber(referenceNumber)
                .orElseThrow(() -> new BadRequestException(
                        "Citizen not found: " + referenceNumber));

        return CitizenResponse.builder()
                .id(citizen.getId().toString())
                .referenceNumber(citizen.getReferenceNumber())
                .fullName(cryptoUtil.decrypt(citizen.getFullNameEncrypted()))
                .dateOfBirth(cryptoUtil.decrypt(citizen.getDobEncrypted()))
                .address(cryptoUtil.decrypt(citizen.getAddressEncrypted()))
                .phone(cryptoUtil.decrypt(citizen.getPhoneEncrypted()))
                .email(cryptoUtil.decrypt(citizen.getEmailEncrypted()))
                .idProofType(citizen.getIdProofType())
                .createdAt(citizen.getCreatedAt().toString())
                .build();
    }

    public List<CitizenResponse> getAllCitizens() {
        return citizenRepository.findAll()
                .stream()
                .map(c -> CitizenResponse.builder()
                        .id(c.getId().toString())
                        .referenceNumber(c.getReferenceNumber())
                        .fullName(cryptoUtil.decrypt(c.getFullNameEncrypted()))
                        .idProofType(c.getIdProofType())
                        .createdAt(c.getCreatedAt().toString())
                        .build())
                .collect(Collectors.toList());
    }

    private CitizenResponse mapToResponse(Citizen citizen, CitizenRequest request) {
        return CitizenResponse.builder()
                .id(citizen.getId().toString())
                .referenceNumber(citizen.getReferenceNumber())
                .fullName(request.getFullName())
                .dateOfBirth(request.getDateOfBirth())
                .address(request.getAddress())
                .phone(request.getPhone())
                .email(request.getEmail())
                .idProofType(request.getIdProofType())
                .createdAt(LocalDateTime.now().toString())
                .build();
    }
}