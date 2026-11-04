package com.uniconnect.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Full name is required")
        @Size(min = 2, max = 120, message = "Full name must be between 2 and 120 characters")
        String fullName,

        @NotBlank(message = "University ID is required")
        @Size(min = 3, max = 40, message = "University ID must be between 3 and 40 characters")
        @Pattern(regexp = "^[A-Za-z0-9/-]+$", message = "University ID may contain letters, numbers, hyphen and slash only")
        String universityId,

        @NotBlank(message = "University email is required")
        @Pattern(
                regexp = "(?i)^[A-Z0-9._%+-]+@klu\\.ac\\.in$",
                message = "A valid Kalasalingam University email ending in @klu.ac.in is required"
        )
        String email,

        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 72, message = "Password must be between 8 and 72 characters")
        @Pattern(
                regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).+$",
                message = "Password must include uppercase, lowercase, number and special character"
        )
        String password,

        @NotBlank(message = "Please confirm your password")
        String confirmPassword,

        @NotBlank(message = "Department is required")
        @Size(max = 100)
        String department,

        @NotBlank(message = "Academic year is required")
        @Size(max = 30)
        String academicYear
) {
}
