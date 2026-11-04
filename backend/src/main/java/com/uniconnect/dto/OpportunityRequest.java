package com.uniconnect.dto;

import com.uniconnect.entity.OpportunityCategory;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record OpportunityRequest(
        @NotBlank(message = "Title is required")
        @Size(min = 3, max = 200)
        String title,

        @NotBlank(message = "Description is required")
        @Size(min = 10, max = 10000)
        String description,

        @NotNull(message = "Category is required")
        OpportunityCategory category,

        @NotBlank(message = "Organization is required")
        @Size(max = 150)
        String organization,

        @NotBlank(message = "Application URL is required")
        @Pattern(regexp = "^https?://.+", message = "Application URL must start with http:// or https://")
        @Size(max = 500)
        String applicationUrl,

        @NotNull(message = "Deadline is required")
        @FutureOrPresent(message = "Deadline cannot be in the past")
        LocalDate deadline
) {
}
