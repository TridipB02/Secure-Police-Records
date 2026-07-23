package com.secure.policerecord.service;

import com.secure.policerecord.exception.BadRequestException;
import com.secure.policerecord.exception.ResourceNotFoundException;
import com.secure.policerecord.model.Citizen;
import com.secure.policerecord.model.Role;
import com.secure.policerecord.model.User;
import com.secure.policerecord.repository.CitizenRepository;
import com.secure.policerecord.repository.UserRepository;
import com.secure.policerecord.request.LoginRequest;
import com.secure.policerecord.request.RegisterCitizenRequest;
import com.secure.policerecord.request.RegisterRequest;
import com.secure.policerecord.response.AuthResponse;
import com.secure.policerecord.response.UserResponse;
import com.secure.policerecord.security.JwtUtil;
import com.secure.policerecord.util.CryptoUtil;
import com.secure.policerecord.util.HashUtil;
import com.secure.policerecord.util.ReferenceGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final CitizenRepository citizenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final CryptoUtil cryptoUtil;
    private final HashUtil hashUtil;
    private final ReferenceGenerator referenceGenerator;
    private final AuditService auditService;
    
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadRequestException("Invalid password");
        }

        if (!user.getIsActive()) {
            throw new BadRequestException("User account is inactive");
        }

        String token = jwtUtil.generateToken(
                user.getUsername(),
                user.getRole().name()
        );

        auditService.logAction(
                user.getUsername(), "LOGIN", "USER",
                user.getUsername(),
                "User logged in",
                null
        );

        return AuthResponse.builder()
                .token(token)
                .username(user.getUsername())
                .role(user.getRole().name())
                .fullName(user.getFullName())
                .build();
    }

    @Transactional
    public void logout(String username) {
        auditService.logAction(
                username, "LOGOUT", "USER",
                username,
                "User logged out",
                null
        );
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Username already exists");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already exists");
        }

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .email(request.getEmail())
                .role(request.getRole())
                .citizenReferenceNumber(request.getCitizenReferenceNumber())
                .badgeNumber(request.getBadgeNumber())
                .stationCode(request.getStationCode())
                .isActive(true)
                .build();

        userRepository.save(user);

        String token = jwtUtil.generateToken(
                user.getUsername(),
                user.getRole().name()
        );

        return AuthResponse.builder()
                .token(token)
                .username(user.getUsername())
                .role(user.getRole().name())
                .fullName(user.getFullName())
                .build();
    }
    
    @Transactional
    public AuthResponse registerCitizenSelf(RegisterCitizenRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Username already exists");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already exists");
        }

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

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .email(request.getEmail())
                .role(Role.CITIZEN)
                .citizenReferenceNumber(referenceNumber)
                .isActive(true)
                .build();

        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole().name());

        return AuthResponse.builder()
                .token(token)
                .username(user.getUsername())
                .role(user.getRole().name())
                .fullName(user.getFullName())
                .citizenReferenceNumber(referenceNumber)
                .build();
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .filter(User::getIsActive)
                .map(u -> UserResponse.builder()
                        .username(u.getUsername())
                        .fullName(u.getFullName())
                        .email(u.getEmail())
                        .role(u.getRole().name())
                        .badgeNumber(u.getBadgeNumber())
                        .stationCode(u.getStationCode())
                        .citizenReferenceNumber(u.getCitizenReferenceNumber())
                        .createdAt(u.getCreatedAt() != null ? u.getCreatedAt().toString() : null)
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteUser(String username, String requestingAdminUsername) {
        if (username.equalsIgnoreCase(requestingAdminUsername)) {
            throw new BadRequestException("Admin cannot delete their own account");
        }
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        user.setIsActive(false);
        userRepository.save(user);
    }
}