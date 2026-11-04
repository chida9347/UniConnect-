package com.uniconnect.dto;

import java.util.List;

public record DashboardResponse(
        UserResponse user,
        long postCount,
        long noteCount,
        long questionCount,
        long answerCount,
        List<ActivityResponse> recentActivity
) {
}
