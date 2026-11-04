package com.uniconnect.dto;

import java.time.Instant;

public record FacultyResponse(
        Long id,
        String name,
        String department,
        String designation,
        String email,
        String specialization,
        String contactInfo,
        Instant createdAt,
        Instant updatedAt
) {
}
