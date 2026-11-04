package com.uniconnect.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @NotBlank(message = "Full name is required")
        @Size(min = 2, max = 120, message = "Full name must be between 2 and 120 characters")
        String fullName,

        @NotBlank(message = "Department is required")
        @Size(max = 100)
        String department,

        @NotBlank(message = "Academic year is required")
        @Size(max = 30)
        String academicYear
) {
}
