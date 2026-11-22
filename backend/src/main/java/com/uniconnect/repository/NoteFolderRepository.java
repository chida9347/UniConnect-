package com.uniconnect.repository;

import com.uniconnect.entity.NoteFolder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NoteFolderRepository extends JpaRepository<NoteFolder, Long> {

    List<NoteFolder> findAllByOrderByNameAsc();

    Optional<NoteFolder> findByNameIgnoreCase(String name);
}
