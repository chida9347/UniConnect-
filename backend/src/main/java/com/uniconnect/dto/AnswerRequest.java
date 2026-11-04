package com.uniconnect.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AnswerRequest(
        @NotBlank(message = "Answer is required")
        @Size(min = 2, max = 5000, message = "Answer must be between 2 and 5,000 characters")
        String content
) {
}
