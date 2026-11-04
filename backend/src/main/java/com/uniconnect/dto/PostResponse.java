package com.uniconnect.dto;

import java.time.Instant;

public record PostResponse(
        Long id,
        String title,
        String content,
        UserSummaryResponse author,
        Instant createdAt,
        Instant updatedAt
) {
}
