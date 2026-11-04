package com.uniconnect.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "University email is required") String email,
        @NotBlank(message = "Password is required") String password
) {
}
