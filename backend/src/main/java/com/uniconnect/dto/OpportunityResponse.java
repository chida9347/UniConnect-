package com.uniconnect.dto;

import com.uniconnect.entity.OpportunityCategory;

import java.time.Instant;
import java.time.LocalDate;

public record OpportunityResponse(
        Long id,
        String title,
        String description,
        OpportunityCategory category,
        String organization,
        String applicationUrl,
        LocalDate deadline,
        UserSummaryResponse postedBy,
        Instant createdAt,
        Instant updatedAt
) {
}
