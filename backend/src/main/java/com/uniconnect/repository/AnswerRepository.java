package com.uniconnect.repository;

import com.uniconnect.entity.Answer;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnswerRepository extends JpaRepository<Answer, Long> {

    long countByQuestionId(Long questionId);

    long countByAuthorId(Long authorId);
}
