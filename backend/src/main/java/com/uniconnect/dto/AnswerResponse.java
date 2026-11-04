package com.uniconnect.dto;

import java.time.Instant;

public record AnswerResponse(
        Long id,
        String content,
        UserSummaryResponse author,
        Instant createdAt
) {
}
