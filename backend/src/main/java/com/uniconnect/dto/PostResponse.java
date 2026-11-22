package com.uniconnect.dto;

import java.time.Instant;
import java.util.List;

public record PostResponse(
        Long id,
        String title,
        String content,
        UserSummaryResponse author,
        Instant createdAt,
        Instant updatedAt,
        List<PostImageResponse> images
) {
}
