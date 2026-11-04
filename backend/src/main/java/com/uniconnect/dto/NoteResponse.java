package com.uniconnect.dto;

import java.time.Instant;

public record NoteResponse(
        Long id,
        String title,
        String subject,
        String description,
        String originalFilename,
        String contentType,
        Long fileSize,
        UserSummaryResponse uploader,
        Instant createdAt,
        String downloadUrl
) {
}
