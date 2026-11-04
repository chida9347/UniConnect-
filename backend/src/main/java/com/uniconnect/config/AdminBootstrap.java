package com.uniconnect.config;

import com.uniconnect.entity.Role;
import com.uniconnect.entity.User;
import com.uniconnect.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Locale;

/**
 * Creates an administrator only when ADMIN_EMAIL and ADMIN_PASSWORD are supplied
 * through environment variables. No default admin credentials exist in source.
 */
@Component
public class AdminBootstrap implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String email;
    private final String password;
    private final String fullName;
    private final String universityId;
    private final String department;

    public AdminBootstrap(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.admin.email:}") String email,
            @Value("${app.admin.password:}") String password,
            @Value("${app.admin.full-name:UniConnect Administrator}") String fullName,
            @Value("${app.admin.university-id:ADMIN-001}") String universityId,
            @Value("${app.admin.department:Administration}") String department
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.email = email;
        this.password = password;
        this.fullName = fullName;
        this.universityId = universityId;
        this.department = department;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!StringUtils.hasText(email) || !StringUtils.hasText(password)) {
            log.info("Admin bootstrap skipped: ADMIN_EMAIL and ADMIN_PASSWORD are not both configured.");
            return;
        }
        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            log.info("Admin bootstrap skipped: an account with the configured admin email already exists.");
            return;
        }
        User admin = new User();
        admin.setFullName(fullName.trim());
        admin.setEmail(normalizedEmail);
        admin.setUniversityId(universityId.trim().toUpperCase(Locale.ROOT));
        admin.setPasswordHash(passwordEncoder.encode(password));
        admin.setDepartment(department.trim());
        admin.setAcademicYear("Administration");
        admin.setRole(Role.ADMIN);
        userRepository.save(admin);
        log.info("Administrator account created for {}", normalizedEmail);
    }
}
