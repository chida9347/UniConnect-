package com.uniconnect.service;

import com.uniconnect.dto.AuthResponse;
import com.uniconnect.dto.LoginRequest;
import com.uniconnect.dto.RegisterRequest;
import com.uniconnect.dto.UserResponse;
import com.uniconnect.entity.Role;
import com.uniconnect.entity.User;
import com.uniconnect.exception.BadRequestException;
import com.uniconnect.exception.ConflictException;
import com.uniconnect.repository.UserRepository;
import com.uniconnect.security.JwtService;
import com.uniconnect.security.UserPrincipal;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final CurrentUserService currentUserService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            CurrentUserService currentUserService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.currentUserService = currentUserService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (!request.password().equals(request.confirmPassword())) {
            throw new BadRequestException("Passwords do not match");
        }

        String email = normalizeEmail(request.email());
        String universityId = request.universityId().trim().toUpperCase(Locale.ROOT);

        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ConflictException("An account with this university email already exists");
        }
        if (userRepository.existsByUniversityIdIgnoreCase(universityId)) {
            throw new ConflictException("An account with this university ID already exists");
        }

        User user = new User();
        user.setFullName(request.fullName().trim());
        user.setUniversityId(universityId);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setDepartment(request.department().trim());
        user.setAcademicYear(request.academicYear().trim());
        user.setRole(Role.STUDENT);

        User saved = userRepository.save(user);
        UserPrincipal principal = UserPrincipal.from(saved);
        return new AuthResponse(jwtService.generateToken(principal), "Bearer",
                jwtService.getExpirationMs() / 1000, Mappers.toUser(saved));
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.email());
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.password()));
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new BadRequestException("Account could not be loaded"));
        return new AuthResponse(jwtService.generateToken(principal), "Bearer",
                jwtService.getExpirationMs() / 1000, Mappers.toUser(user));
    }

    @Transactional(readOnly = true)
    public UserResponse me() {
        return Mappers.toUser(currentUserService.requireCurrentUser());
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
