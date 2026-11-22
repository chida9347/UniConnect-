package com.uniconnect.repository;

import com.uniconnect.entity.PostImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PostImageRepository extends JpaRepository<PostImage, Long> {

    List<PostImage> findByPostIdOrderByCreatedAtAsc(Long postId);
}
