package com.uniconnect.repository;

import com.uniconnect.entity.Question;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Long> {

    Page<Question> findByTitleContainingIgnoreCaseOrContentContainingIgnoreCase(
            String title, String content, Pageable pageable);

    List<Question> findTop5ByAuthorIdOrderByCreatedAtDesc(Long authorId);

    long countByAuthorId(Long authorId);
}
