package com.uniconnect.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PostRequest(
        @NotBlank(message = "Post title is required")
        @Size(min = 3, max = 180, message = "Title must be between 3 and 180 characters")
        String title,

        @NotBlank(message = "Post content is required")
        @Size(min = 10, max = 10000, message = "Content must be between 10 and 10,000 characters")
        String content
) {
}
