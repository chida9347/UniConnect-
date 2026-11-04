package com.uniconnect.dto;

import java.time.Instant;

public record ActivityResponse(
        String type,
        Long id,
        String title,
        Instant createdAt
) {
}
