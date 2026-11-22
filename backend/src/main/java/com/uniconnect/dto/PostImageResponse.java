package com.uniconnect.dto;

public record PostImageResponse(
        Long id,
        String url,
        String originalFilename,
        String contentType,
        Long fileSize
) {
}
