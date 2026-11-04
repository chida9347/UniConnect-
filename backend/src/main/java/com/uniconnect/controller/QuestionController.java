package com.uniconnect.controller;

import com.uniconnect.dto.AnswerRequest;
import com.uniconnect.dto.AnswerResponse;
import com.uniconnect.dto.MessageResponse;
import com.uniconnect.dto.PageResponse;
import com.uniconnect.dto.QuestionRequest;
import com.uniconnect.dto.QuestionResponse;
import com.uniconnect.service.QuestionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/questions")
public class QuestionController {

    private final QuestionService questionService;

    public QuestionController(QuestionService questionService) {
        this.questionService = questionService;
    }

    @GetMapping
    public ResponseEntity<PageResponse<QuestionResponse>> list(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(questionService.list(search, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuestionResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(questionService.get(id));
    }

    @PostMapping
    public ResponseEntity<QuestionResponse> create(@Valid @RequestBody QuestionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(questionService.create(request));
    }

    @PostMapping("/{id}/answers")
    public ResponseEntity<AnswerResponse> answer(@PathVariable Long id,
                                                 @Valid @RequestBody AnswerRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(questionService.addAnswer(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<MessageResponse> delete(@PathVariable Long id) {
        questionService.delete(id);
        return ResponseEntity.ok(new MessageResponse("Question deleted"));
    }
}
