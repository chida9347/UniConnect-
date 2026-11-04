package com.uniconnect.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record FacultyRequest(
        @NotBlank(message = "Faculty name is required")
        @Size(max = 120)
        String name,

        @NotBlank(message = "Department is required")
        @Size(max = 100)
        String department,

        @NotBlank(message = "Designation is required")
        @Size(max = 100)
        String designation,

        @NotBlank(message = "Email is required")
        @Email(message = "Enter a valid email address")
        @Size(max = 160)
        String email,

        @NotBlank(message = "Specialization is required")
        @Size(max = 180)
        String specialization,

        @Size(max = 200)
        String contactInfo
) {
}
