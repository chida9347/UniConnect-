package com.uniconnect.dto;

import com.uniconnect.entity.Role;

import java.time.Instant;

public record UserResponse(
        Long id,
        String fullName,
        String universityId,
        String email,
        String department,
        String academicYear,
        Role role,
        Instant createdAt
) {
}
