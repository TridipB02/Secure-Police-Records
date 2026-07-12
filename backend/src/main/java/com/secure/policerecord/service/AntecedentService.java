package com.secure.policerecord.service;

import com.secure.policerecord.exception.BadRequestException;
import com.secure.policerecord.exception.ResourceNotFoundException;
import com.secure.policerecord.model.*;
import com.secure.policerecord.repository.*;
import com.secure.policerecord.request.AntecedentRequest;
import com.secure.policerecord.util.CryptoUtil;
import com.secure.policerecord.util.HashUtil;
import com.secure.policerecord.util.ReferenceGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.secure.policerecord.response.AntecedentReportResponse;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AntecedentService {

    private final AntecedentRepository antecedentRepository;
    private final CitizenRepository citizenRepository;
    private final UserRepository userRepository;
    private final CryptoUtil cryptoUtil;
    private final HashUtil hashUtil;
    private final ReferenceGenerator referenceGenerator;

    @Transactional
    public AntecedentReportResponse submitAntecedentReport(
            AntecedentRequest request, String officerUsername) {

        Citizen citizen = citizenRepository
                .findByReferenceNumber(request.getCitizenReferenceNumber())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Citizen not found: " + request.getCitizenReferenceNumber()));

        User officer = userRepository.findByUsername(officerUsername)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Officer not found: " + officerUsername));

        String reportNumber = referenceGenerator.generateAntecedentNumber();

        String firHistoryEncrypted = request.getFirHistory() != null
                ? cryptoUtil.encrypt(request.getFirHistory()) : null;

        AntecedentStatus status = AntecedentStatus.valueOf(
                request.getOverallStatus().toUpperCase());

        String reportData = reportNumber + citizen.getId().toString()
                + request.getOverallStatus() + LocalDateTime.now();
        String reportHash = hashUtil.generateSHA256(reportData);

        AntecedentReport report = AntecedentReport.builder()
                .reportNumber(reportNumber)
                .citizen(citizen)
                .officer(officer)
                .firHistoryEncrypted(firHistoryEncrypted)
                .convictionStatus(request.getConvictionStatus())
                .pendingCases(request.getPendingCases() != null
                        ? request.getPendingCases() : 0)
                .blacklistFlag(request.getBlacklistFlag() != null
                        ? request.getBlacklistFlag() : false)
                .overallStatus(status)
                .reportHash(reportHash)
                .submittedAt(LocalDateTime.now())
                .build();

        antecedentRepository.save(report);

        return mapToResponse(report);
    }

    @Transactional(readOnly = true)
    public AntecedentReportResponse getReportByNumber(String reportNumber) {
        AntecedentReport report = antecedentRepository
                .findByReportNumber(reportNumber)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Report not found: " + reportNumber));
        return mapToResponse(report);
    }

    @Transactional(readOnly = true)
    public List<AntecedentReportResponse> getReportsByCitizen(UUID citizenId) {
        return antecedentRepository.findByCitizenId(citizenId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<AntecedentReportResponse> getReportsByStatus(String status) {
        AntecedentStatus antecedentStatus = AntecedentStatus.valueOf(
                status.toUpperCase());
        return antecedentRepository.findByOverallStatus(antecedentStatus)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AntecedentReportResponse> getReportsByOfficer(String officerUsername) {
        User officer = userRepository.findByUsername(officerUsername)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Officer not found: " + officerUsername));
        return antecedentRepository.findByOfficerId(officer.getId())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private AntecedentReportResponse mapToResponse(AntecedentReport report) {
        return AntecedentReportResponse.builder()
                .id(report.getId().toString())
                .reportNumber(report.getReportNumber())
                .citizenReference(report.getCitizen().getReferenceNumber())
                .officerName(report.getOfficer() != null
                        ? report.getOfficer().getFullName() : "Unassigned")
                .convictionStatus(report.getConvictionStatus())
                .pendingCases(report.getPendingCases())
                .blacklistFlag(report.getBlacklistFlag())
                .overallStatus(report.getOverallStatus().name())
                .reportHash(report.getReportHash())
                .blockchainTxId(report.getBlockchainTxId())
                .submittedAt(report.getSubmittedAt() != null
                        ? report.getSubmittedAt().toString() : null)
                .build();
    }
}