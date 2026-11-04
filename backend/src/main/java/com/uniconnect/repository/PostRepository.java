package com.uniconnect.repository;

import com.uniconnect.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {

    Page<Post> findByTitleContainingIgnoreCaseOrContentContainingIgnoreCase(
            String title, String content, Pageable pageable);

    List<Post> findTop5ByAuthorIdOrderByCreatedAtDesc(Long authorId);

    long countByAuthorId(Long authorId);
}
