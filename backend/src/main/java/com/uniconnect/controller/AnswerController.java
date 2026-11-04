package com.uniconnect.controller;

import com.uniconnect.dto.MessageResponse;
import com.uniconnect.service.QuestionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/answers")
public class AnswerController {

    private final QuestionService questionService;

    public AnswerController(QuestionService questionService) {
        this.questionService = questionService;
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<MessageResponse> delete(@PathVariable Long id) {
        questionService.deleteAnswer(id);
        return ResponseEntity.ok(new MessageResponse("Answer deleted"));
    }
}
