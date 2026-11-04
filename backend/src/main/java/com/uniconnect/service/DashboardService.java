package com.uniconnect.service;

import com.uniconnect.dto.ActivityResponse;
import com.uniconnect.dto.DashboardResponse;
import com.uniconnect.entity.User;
import com.uniconnect.repository.AnswerRepository;
import com.uniconnect.repository.NoteRepository;
import com.uniconnect.repository.PostRepository;
import com.uniconnect.repository.QuestionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class DashboardService {

    private final PostRepository postRepository;
    private final NoteRepository noteRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final CurrentUserService currentUserService;

    public DashboardService(PostRepository postRepository, NoteRepository noteRepository,
                            QuestionRepository questionRepository, AnswerRepository answerRepository,
                            CurrentUserService currentUserService) {
        this.postRepository = postRepository;
        this.noteRepository = noteRepository;
        this.questionRepository = questionRepository;
        this.answerRepository = answerRepository;
        this.currentUserService = currentUserService;
    }

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard() {
        User user = currentUserService.requireCurrentUser();
        List<ActivityResponse> activity = new ArrayList<>();
        postRepository.findTop5ByAuthorIdOrderByCreatedAtDesc(user.getId())
                .forEach(post -> activity.add(new ActivityResponse("POST", post.getId(), post.getTitle(), post.getCreatedAt())));
        noteRepository.findTop5ByUploaderIdOrderByCreatedAtDesc(user.getId())
                .forEach(note -> activity.add(new ActivityResponse("NOTE", note.getId(), note.getTitle(), note.getCreatedAt())));
        questionRepository.findTop5ByAuthorIdOrderByCreatedAtDesc(user.getId())
                .forEach(question -> activity.add(new ActivityResponse("QUESTION", question.getId(), question.getTitle(), question.getCreatedAt())));

        List<ActivityResponse> recent = activity.stream()
                .sorted(Comparator.comparing(ActivityResponse::createdAt).reversed())
                .limit(6)
                .toList();

        return new DashboardResponse(
                Mappers.toUser(user),
                postRepository.countByAuthorId(user.getId()),
                noteRepository.countByUploaderId(user.getId()),
                questionRepository.countByAuthorId(user.getId()),
                answerRepository.countByAuthorId(user.getId()),
                recent
        );
    }
}
