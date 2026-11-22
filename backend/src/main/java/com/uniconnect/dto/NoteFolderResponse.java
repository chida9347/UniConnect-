package com.uniconnect.dto;

import java.time.Instant;

public record NoteFolderResponse(
        Long id,
        String name,
        long noteCount,
        UserSummaryResponse createdBy,
        Instant createdAt
) {
}
