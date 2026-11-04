package com.uniconnect.service;

import com.uniconnect.dto.NoteResponse;
import com.uniconnect.dto.NoteUploadRequest;
import com.uniconnect.dto.PageResponse;
import com.uniconnect.entity.Note;
import com.uniconnect.entity.User;
import com.uniconnect.exception.BadRequestException;
import com.uniconnect.exception.NotFoundException;
import com.uniconnect.repository.NoteRepository;
import com.uniconnect.storage.StorageService;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class NoteService {

    private static final long MAX_FILE_SIZE = 20L * 1024 * 1024;
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "pdf", "doc", "docx", "ppt", "pptx", "txt", "xls", "xlsx", "png", "jpg", "jpeg"
    );
    private static final Map<String, String> CONTENT_TYPES = Map.ofEntries(
            Map.entry("pdf", "application/pdf"),
            Map.entry("doc", "application/msword"),
            Map.entry("docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
            Map.entry("ppt", "application/vnd.ms-powerpoint"),
            Map.entry("pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"),
            Map.entry("txt", "text/plain"),
            Map.entry("xls", "application/vnd.ms-excel"),
            Map.entry("xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
            Map.entry("png", "image/png"),
            Map.entry("jpg", "image/jpeg"),
            Map.entry("jpeg", "image/jpeg")
    );

    private final NoteRepository noteRepository;
    private final StorageService storageService;
    private final CurrentUserService currentUserService;

    public NoteService(NoteRepository noteRepository, StorageService storageService,
                       CurrentUserService currentUserService) {
        this.noteRepository = noteRepository;
        this.storageService = storageService;
        this.currentUserService = currentUserService;
    }

    @Transactional(readOnly = true)
    public PageResponse<NoteResponse> list(String search, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 50),
                Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Note> notes;
        if (StringUtils.hasText(search)) {
            String term = search.trim();
            notes = noteRepository.findByTitleContainingIgnoreCaseOrSubjectContainingIgnoreCase(term, term, pageable);
        } else {
            notes = noteRepository.findAll(pageable);
        }
        return PageResponse.from(notes, Mappers::toNote);
    }

    @Transactional
    public NoteResponse upload(NoteUploadRequest request) {
        MultipartFile file = request.getFile();
        validateFile(file);

        String originalFilename = sanitizeFilename(file.getOriginalFilename());
        String extension = StringUtils.getFilenameExtension(originalFilename).toLowerCase(Locale.ROOT);
        String storageKey = "notes/" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM"))
                + "/" + UUID.randomUUID() + "." + extension;
        String contentType = CONTENT_TYPES.get(extension);

        User uploader = currentUserService.requireCurrentUser();
        storageService.store(file, storageKey);

        try {
            Note note = new Note();
            note.setTitle(request.getTitle().trim());
            note.setSubject(request.getSubject().trim());
            note.setDescription(StringUtils.hasText(request.getDescription()) ? request.getDescription().trim() : null);
            note.setOriginalFilename(originalFilename);
            note.setStorageKey(storageKey);
            note.setContentType(contentType);
            note.setFileSize(file.getSize());
            note.setUploader(uploader);
            return Mappers.toNote(noteRepository.save(note));
        } catch (RuntimeException exception) {
            storageService.delete(storageKey);
            throw exception;
        }
    }

    @Transactional(readOnly = true)
    public Download download(Long id) {
        Note note = findNote(id);
        return new Download(note, storageService.load(note.getStorageKey()));
    }

    @Transactional
    public void delete(Long id) {
        Note note = findNote(id);
        currentUserService.requireOwnerOrAdmin(note.getUploader());
        storageService.delete(note.getStorageKey());
        noteRepository.delete(note);
    }

    private Note findNote(Long id) {
        return noteRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Study note not found"));
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Please select a file to upload");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BadRequestException("File is too large. The maximum upload size is 20 MB");
        }
        String filename = sanitizeFilename(file.getOriginalFilename());
        String extension = StringUtils.getFilenameExtension(filename);
        if (extension == null || !ALLOWED_EXTENSIONS.contains(extension.toLowerCase(Locale.ROOT))) {
            throw new BadRequestException("Unsupported file type. Upload PDF, Word, PowerPoint, Excel, text or image files");
        }
    }

    private String sanitizeFilename(String filename) {
        if (!StringUtils.hasText(filename)) {
            throw new BadRequestException("The uploaded file must have a filename");
        }
        String cleaned = StringUtils.cleanPath(filename);
        if (cleaned.contains("..")) {
            throw new BadRequestException("Invalid filename");
        }
        return cleaned.replaceAll("[\\\\/:*?\"<>|]", "_");
    }

    public record Download(Note note, Resource resource) {
    }
}
