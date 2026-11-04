package com.uniconnect.service;

import com.uniconnect.dto.AnswerResponse;
import com.uniconnect.dto.FacultyResponse;
import com.uniconnect.dto.NoteResponse;
import com.uniconnect.dto.OpportunityResponse;
import com.uniconnect.dto.PostResponse;
import com.uniconnect.dto.QuestionResponse;
import com.uniconnect.dto.UserResponse;
import com.uniconnect.dto.UserSummaryResponse;
import com.uniconnect.entity.Answer;
import com.uniconnect.entity.Faculty;
import com.uniconnect.entity.Note;
import com.uniconnect.entity.Opportunity;
import com.uniconnect.entity.Post;
import com.uniconnect.entity.Question;
import com.uniconnect.entity.User;

import java.util.List;

public final class Mappers {

    private Mappers() {
    }

    public static UserSummaryResponse toSummary(User user) {
        return new UserSummaryResponse(
                user.getId(),
                user.getFullName(),
                user.getUniversityId(),
                user.getDepartment(),
                user.getRole()
        );
    }

    public static UserResponse toUser(User user) {
        return new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getUniversityId(),
                user.getEmail(),
                user.getDepartment(),
                user.getAcademicYear(),
                user.getRole(),
                user.getCreatedAt()
        );
    }

    public static PostResponse toPost(Post post) {
        return new PostResponse(
                post.getId(),
                post.getTitle(),
                post.getContent(),
                toSummary(post.getAuthor()),
                post.getCreatedAt(),
                post.getUpdatedAt()
        );
    }

    public static NoteResponse toNote(Note note) {
        return new NoteResponse(
                note.getId(),
                note.getTitle(),
                note.getSubject(),
                note.getDescription(),
                note.getOriginalFilename(),
                note.getContentType(),
                note.getFileSize(),
                toSummary(note.getUploader()),
                note.getCreatedAt(),
                "/api/notes/" + note.getId() + "/download"
        );
    }

    public static AnswerResponse toAnswer(Answer answer) {
        return new AnswerResponse(
                answer.getId(),
                answer.getContent(),
                toSummary(answer.getAuthor()),
                answer.getCreatedAt()
        );
    }

    public static QuestionResponse toQuestion(Question question, boolean includeAnswers) {
        List<AnswerResponse> answers = includeAnswers
                ? question.getAnswers().stream().map(Mappers::toAnswer).toList()
                : List.of();
        return new QuestionResponse(
                question.getId(),
                question.getTitle(),
                question.getContent(),
                toSummary(question.getAuthor()),
                question.getCreatedAt(),
                question.getUpdatedAt(),
                question.getAnswers().size(),
                answers
        );
    }

    public static FacultyResponse toFaculty(Faculty faculty) {
        return new FacultyResponse(
                faculty.getId(),
                faculty.getName(),
                faculty.getDepartment(),
                faculty.getDesignation(),
                faculty.getEmail(),
                faculty.getSpecialization(),
                faculty.getContactInfo(),
                faculty.getCreatedAt(),
                faculty.getUpdatedAt()
        );
    }

    public static OpportunityResponse toOpportunity(Opportunity opportunity) {
        return new OpportunityResponse(
                opportunity.getId(),
                opportunity.getTitle(),
                opportunity.getDescription(),
                opportunity.getCategory(),
                opportunity.getOrganization(),
                opportunity.getApplicationUrl(),
                opportunity.getDeadline(),
                opportunity.getPostedBy() == null ? null : toSummary(opportunity.getPostedBy()),
                opportunity.getCreatedAt(),
                opportunity.getUpdatedAt()
        );
    }
}
