package com.uniconnect.service;

import com.uniconnect.dto.NoteFolderResponse;
import com.uniconnect.dto.NoteFolderRequest;
import com.uniconnect.entity.NoteFolder;
import com.uniconnect.exception.BadRequestException;
import com.uniconnect.exception.ConflictException;
import com.uniconnect.exception.NotFoundException;
import com.uniconnect.repository.NoteFolderRepository;
import com.uniconnect.repository.NoteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
public class NoteFolderService {

    private final NoteFolderRepository noteFolderRepository;
    private final NoteRepository noteRepository;
    private final CurrentUserService currentUserService;

    public NoteFolderService(NoteFolderRepository noteFolderRepository, NoteRepository noteRepository,
                             CurrentUserService currentUserService) {
        this.noteFolderRepository = noteFolderRepository;
        this.noteRepository = noteRepository;
        this.currentUserService = currentUserService;
    }

    @Transactional(readOnly = true)
    public List<NoteFolderResponse> list() {
        return noteFolderRepository.findAllByOrderByNameAsc().stream()
                .map(folder -> Mappers.toNoteFolder(folder, noteRepository.countByFolderId(folder.getId())))
                .toList();
    }

    @Transactional
    public NoteFolderResponse create(NoteFolderRequest request) {
        String name = request.name() == null ? "" : request.name().trim().replaceAll("\\s+", " ");
        if (!StringUtils.hasText(name)) {
            throw new BadRequestException("Folder name is required");
        }
        if (noteFolderRepository.findByNameIgnoreCase(name).isPresent()) {
            throw new ConflictException("A folder with this name already exists");
        }
        NoteFolder folder = new NoteFolder();
        folder.setName(name);
        folder.setCreatedBy(currentUserService.requireCurrentUser());
        NoteFolder saved = noteFolderRepository.saveAndFlush(folder);
        return Mappers.toNoteFolder(saved, 0);
    }

    @Transactional
    public void delete(Long id) {
        NoteFolder folder = noteFolderRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Study folder not found"));
        currentUserService.requireOwnerOrAdmin(folder.getCreatedBy());
        long notes = noteRepository.countByFolderId(id);
        if (notes > 0) {
            throw new ConflictException("Move or delete the " + notes + " file(s) in this folder first");
        }
        noteFolderRepository.delete(folder);
    }
}
