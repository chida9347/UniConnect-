package com.uniconnect.controller;

import com.uniconnect.dto.MessageResponse;
import com.uniconnect.dto.PageResponse;
import com.uniconnect.dto.UserResponse;
import com.uniconnect.entity.Role;
import com.uniconnect.service.AdminUserService;
import com.uniconnect.service.NoteService;
import com.uniconnect.service.PostService;
import com.uniconnect.service.QuestionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminUserService adminUserService;
    private final PostService postService;
    private final QuestionService questionService;
    private final NoteService noteService;

    public AdminController(AdminUserService adminUserService, PostService postService,
                           QuestionService questionService, NoteService noteService) {
        this.adminUserService = adminUserService;
        this.postService = postService;
        this.questionService = questionService;
        this.noteService = noteService;
    }

    @GetMapping("/users")
    public ResponseEntity<PageResponse<UserResponse>> users(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(required = false) Role role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        return ResponseEntity.ok(adminUserService.list(search, role, page, size));
    }

    @DeleteMapping("/posts/{id}")
    public ResponseEntity<MessageResponse> deletePost(@PathVariable Long id) {
        postService.delete(id);
        return ResponseEntity.ok(new MessageResponse("Post removed by moderator"));
    }

    @DeleteMapping("/questions/{id}")
    public ResponseEntity<MessageResponse> deleteQuestion(@PathVariable Long id) {
        questionService.delete(id);
        return ResponseEntity.ok(new MessageResponse("Question removed by moderator"));
    }

    @DeleteMapping("/notes/{id}")
    public ResponseEntity<MessageResponse> deleteNote(@PathVariable Long id) {
        noteService.delete(id);
        return ResponseEntity.ok(new MessageResponse("Note removed by moderator"));
    }
}
