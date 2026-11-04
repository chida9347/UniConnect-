package com.uniconnect.service;

import com.uniconnect.dto.AnswerRequest;
import com.uniconnect.dto.AnswerResponse;
import com.uniconnect.dto.PageResponse;
import com.uniconnect.dto.QuestionRequest;
import com.uniconnect.dto.QuestionResponse;
import com.uniconnect.entity.Answer;
import com.uniconnect.entity.Question;
import com.uniconnect.entity.User;
import com.uniconnect.exception.NotFoundException;
import com.uniconnect.repository.AnswerRepository;
import com.uniconnect.repository.QuestionRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class QuestionService {

    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final CurrentUserService currentUserService;

    public QuestionService(QuestionRepository questionRepository, AnswerRepository answerRepository,
                           CurrentUserService currentUserService) {
        this.questionRepository = questionRepository;
        this.answerRepository = answerRepository;
        this.currentUserService = currentUserService;
    }

    @Transactional(readOnly = true)
    public PageResponse<QuestionResponse> list(String search, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 50),
                Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Question> questions;
        if (StringUtils.hasText(search)) {
            String term = search.trim();
            questions = questionRepository.findByTitleContainingIgnoreCaseOrContentContainingIgnoreCase(
                    term, term, pageable);
        } else {
            questions = questionRepository.findAll(pageable);
        }
        return PageResponse.from(questions, question -> Mappers.toQuestion(question, false));
    }

    @Transactional(readOnly = true)
    public QuestionResponse get(Long id) {
        return Mappers.toQuestion(findQuestion(id), true);
    }

    @Transactional
    public QuestionResponse create(QuestionRequest request) {
        User author = currentUserService.requireCurrentUser();
        Question question = new Question();
        question.setTitle(request.title().trim());
        question.setContent(request.content().trim());
        question.setAuthor(author);
        return Mappers.toQuestion(questionRepository.save(question), true);
    }

    @Transactional
    public void delete(Long id) {
        Question question = findQuestion(id);
        currentUserService.requireOwnerOrAdmin(question.getAuthor());
        questionRepository.delete(question);
    }

    @Transactional
    public AnswerResponse addAnswer(Long questionId, AnswerRequest request) {
        Question question = findQuestion(questionId);
        User author = currentUserService.requireCurrentUser();
        Answer answer = new Answer();
        answer.setContent(request.content().trim());
        answer.setQuestion(question);
        answer.setAuthor(author);
        Answer saved = answerRepository.save(answer);
        return Mappers.toAnswer(saved);
    }

    @Transactional
    public void deleteAnswer(Long answerId) {
        Answer answer = answerRepository.findById(answerId)
                .orElseThrow(() -> new NotFoundException("Answer not found"));
        currentUserService.requireOwnerOrAdmin(answer.getAuthor());
        answerRepository.delete(answer);
    }

    private Question findQuestion(Long id) {
        return questionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Question not found"));
    }
}
