package com.uniconnect.repository;

import com.uniconnect.entity.Note;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NoteRepository extends JpaRepository<Note, Long> {

    Page<Note> findByTitleContainingIgnoreCaseOrSubjectContainingIgnoreCase(
            String title, String subject, Pageable pageable);

    List<Note> findTop5ByUploaderIdOrderByCreatedAtDesc(Long uploaderId);

    long countByUploaderId(Long uploaderId);
}
