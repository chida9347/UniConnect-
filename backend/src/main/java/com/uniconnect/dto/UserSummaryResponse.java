package com.uniconnect.dto;

import com.uniconnect.entity.Role;

public record UserSummaryResponse(
        Long id,
        String fullName,
        String universityId,
        String department,
        Role role
) {
}
