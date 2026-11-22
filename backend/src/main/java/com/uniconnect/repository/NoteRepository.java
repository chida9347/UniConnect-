package com.uniconnect.repository;

import com.uniconnect.entity.Note;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NoteRepository extends JpaRepository<Note, Long> {

    @Query("SELECT n FROM Note n WHERE (:folderId IS NULL OR n.folder.id = :folderId) " +
            "AND (:search IS NULL OR :search = '' OR " +
            "LOWER(n.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(n.subject) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Note> search(@Param("folderId") Long folderId, @Param("search") String search, Pageable pageable);

    List<Note> findTop5ByUploaderIdOrderByCreatedAtDesc(Long uploaderId);

    long countByUploaderId(Long uploaderId);

    long countByFolderId(Long folderId);
}
