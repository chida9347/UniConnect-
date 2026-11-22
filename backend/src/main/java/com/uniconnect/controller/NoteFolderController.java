package com.uniconnect.controller;

import com.uniconnect.dto.MessageResponse;
import com.uniconnect.dto.NoteFolderRequest;
import com.uniconnect.dto.NoteFolderResponse;
import com.uniconnect.service.NoteFolderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/note-folders")
public class NoteFolderController {

    private final NoteFolderService noteFolderService;

    public NoteFolderController(NoteFolderService noteFolderService) {
        this.noteFolderService = noteFolderService;
    }

    @GetMapping
    public ResponseEntity<List<NoteFolderResponse>> list() {
        return ResponseEntity.ok(noteFolderService.list());
    }

    @PostMapping
    public ResponseEntity<NoteFolderResponse> create(@Valid @RequestBody NoteFolderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(noteFolderService.create(request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<MessageResponse> delete(@PathVariable Long id) {
        noteFolderService.delete(id);
        return ResponseEntity.ok(new MessageResponse("Study folder deleted"));
    }
}
