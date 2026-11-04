package com.uniconnect.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record QuestionRequest(
        @NotBlank(message = "Question title is required")
        @Size(min = 5, max = 200, message = "Title must be between 5 and 200 characters")
        String title,

        @NotBlank(message = "Question details are required")
        @Size(min = 10, max = 10000, message = "Details must be between 10 and 10,000 characters")
        String content
) {
}
