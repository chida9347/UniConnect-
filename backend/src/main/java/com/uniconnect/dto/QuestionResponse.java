package com.uniconnect.dto;

import java.time.Instant;
import java.util.List;

public record QuestionResponse(
        Long id,
        String title,
        String content,
        UserSummaryResponse author,
        Instant createdAt,
        Instant updatedAt,
        int answerCount,
        List<AnswerResponse> answers
) {
}
