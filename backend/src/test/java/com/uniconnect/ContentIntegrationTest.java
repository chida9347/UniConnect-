package com.uniconnect;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ContentIntegrationTest extends BaseIntegrationTest {

    @Test
    void studentsCanCreateEditSearchAndOnlyOwnerOrAdminCanDeletePosts() throws Exception {
        String ownerToken = registerStudent("owner@klu.ac.in", "KLU-2001");
        String otherToken = registerStudent("other@klu.ac.in", "KLU-2002");

        Map<String, Object> payload = Map.of(
                "title", "Best places to study on campus",
                "content", "Share quiet study spots and useful library timings for exam week."
        );
        MvcResult created = mockMvc.perform(post("/api/posts")
                        .header("Authorization", bearer(ownerToken))
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.author.email").doesNotExist())
                .andReturn();
        long postId = idFrom(created);

        mockMvc.perform(get("/api/posts").param("search", "library")
                        .header("Authorization", bearer(otherToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1));

        mockMvc.perform(put("/api/posts/" + postId)
                        .header("Authorization", bearer(otherToken))
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/posts/" + postId)
                        .header("Authorization", bearer(otherToken)))
                .andExpect(status().isForbidden());

        mockMvc.perform(put("/api/posts/" + postId)
                        .header("Authorization", bearer(ownerToken))
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "title", "Updated study spots",
                                "content", "An updated list of quiet study spaces on campus."))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Updated study spots"));

        String adminToken = createAdminAndLogin("moderator@klu.ac.in");
        mockMvc.perform(delete("/api/admin/posts/" + postId)
                        .header("Authorization", bearer(adminToken)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/posts/" + postId).header("Authorization", bearer(ownerToken)))
                .andExpect(status().isNotFound());
    }

    @Test
    void noteUploadDownloadValidationAndAuthorizationWork() throws Exception {
        String ownerToken = registerStudent("notes.owner@klu.ac.in", "KLU-2101");
        String otherToken = registerStudent("notes.other@klu.ac.in", "KLU-2102");

        MockMultipartFile pdf = new MockMultipartFile(
                "file", "data-structures-notes.pdf", "application/pdf", "%PDF-1.4 test content".getBytes());

        MvcResult created = mockMvc.perform(multipart("/api/notes")
                        .file(pdf)
                        .param("title", "Data Structures Unit 1")
                        .param("subject", "Data Structures")
                        .param("description", "Sample notes used by automated tests")
                        .header("Authorization", bearer(ownerToken)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.originalFilename").value("data-structures-notes.pdf"))
                .andReturn();
        long noteId = idFrom(created);

        mockMvc.perform(get("/api/notes/" + noteId + "/download")
                        .header("Authorization", bearer(otherToken)))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition",
                        org.hamcrest.Matchers.containsString("data-structures-notes.pdf")));

        MockMultipartFile exe = new MockMultipartFile(
                "file", "malware.exe", "application/octet-stream", "bad".getBytes());
        mockMvc.perform(multipart("/api/notes")
                        .file(exe)
                        .param("title", "Invalid upload")
                        .param("subject", "Testing")
                        .header("Authorization", bearer(ownerToken)))
                .andExpect(status().isBadRequest());

        mockMvc.perform(delete("/api/notes/" + noteId)
                        .header("Authorization", bearer(otherToken)))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/notes/" + noteId)
                        .header("Authorization", bearer(ownerToken)))
                .andExpect(status().isOk());
    }

    @Test
    void questionsSupportMultipleAnswersAndOwnershipChecks() throws Exception {
        String askerToken = registerStudent("asker@klu.ac.in", "KLU-2201");
        String answererToken = registerStudent("answerer@klu.ac.in", "KLU-2202");

        MvcResult created = mockMvc.perform(post("/api/questions")
                        .header("Authorization", bearer(askerToken))
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "title", "How do I prepare for the DBMS exam?",
                                "content", "Which topics and previous-year papers should I focus on first?"))))
                .andExpect(status().isCreated())
                .andReturn();
        long questionId = idFrom(created);

        MvcResult answer = mockMvc.perform(post("/api/questions/" + questionId + "/answers")
                        .header("Authorization", bearer(answererToken))
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "content", "Start with normalization, transactions and indexing, then solve previous papers."))))
                .andExpect(status().isCreated())
                .andReturn();
        long answerId = idFrom(answer);

        mockMvc.perform(get("/api/questions/" + questionId)
                        .header("Authorization", bearer(askerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.answerCount").value(1))
                .andExpect(jsonPath("$.answers[0].content").exists());

        mockMvc.perform(delete("/api/answers/" + answerId)
                        .header("Authorization", bearer(askerToken)))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/questions/" + questionId)
                        .header("Authorization", bearer(answererToken)))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/answers/" + answerId)
                        .header("Authorization", bearer(answererToken)))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/questions/" + questionId)
                        .header("Authorization", bearer(askerToken)))
                .andExpect(status().isOk());
    }

    @Test
    void onlyAdminsCanManageFacultyAndOpportunities() throws Exception {
        String studentToken = registerStudent("student@klu.ac.in", "KLU-2301");

        Map<String, Object> facultyPayload = Map.of(
                "name", "[SAMPLE] Dr. Test Faculty",
                "department", "Computer Science and Engineering",
                "designation", "Professor (Sample)",
                "email", "faculty.sample@example.com",
                "specialization", "Software Engineering (Sample)",
                "contactInfo", "+91-00000-00000"
        );

        mockMvc.perform(post("/api/faculty")
                        .header("Authorization", bearer(studentToken))
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(facultyPayload)))
                .andExpect(status().isForbidden());

        String adminToken = createAdminAndLogin("admin@klu.ac.in");
        MvcResult facultyCreated = mockMvc.perform(post("/api/faculty")
                        .header("Authorization", bearer(adminToken))
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(facultyPayload)))
                .andExpect(status().isCreated())
                .andReturn();
        long facultyId = idFrom(facultyCreated);

        mockMvc.perform(get("/api/faculty")
                        .param("search", "Test Faculty")
                        .param("department", "Computer Science and Engineering")
                        .header("Authorization", bearer(studentToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1));

        Map<String, Object> opportunityPayload = new LinkedHashMap<>();
        opportunityPayload.put("title", "Sample Hackathon");
        opportunityPayload.put("description", "A clearly labelled sample opportunity used by automated tests.");
        opportunityPayload.put("category", "HACKATHON");
        opportunityPayload.put("organization", "Example Organization");
        opportunityPayload.put("applicationUrl", "https://example.com/apply");
        opportunityPayload.put("deadline", LocalDate.now().plusDays(14).toString());

        mockMvc.perform(post("/api/opportunities")
                        .header("Authorization", bearer(studentToken))
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(opportunityPayload)))
                .andExpect(status().isForbidden());

        MvcResult opportunityCreated = mockMvc.perform(post("/api/opportunities")
                        .header("Authorization", bearer(adminToken))
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(opportunityPayload)))
                .andExpect(status().isCreated())
                .andReturn();
        long opportunityId = idFrom(opportunityCreated);

        mockMvc.perform(get("/api/opportunities")
                        .param("category", "HACKATHON")
                        .header("Authorization", bearer(studentToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1));

        mockMvc.perform(delete("/api/faculty/" + facultyId)
                        .header("Authorization", bearer(adminToken)))
                .andExpect(status().isOk());
        mockMvc.perform(delete("/api/opportunities/" + opportunityId)
                        .header("Authorization", bearer(adminToken)))
                .andExpect(status().isOk());
    }

    @Test
    void adminUserDirectoryIsProtected() throws Exception {
        String studentToken = registerStudent("student@klu.ac.in", "KLU-2401");

        mockMvc.perform(get("/api/admin/users").header("Authorization", bearer(studentToken)))
                .andExpect(status().isForbidden());

        String adminToken = createAdminAndLogin("admin@klu.ac.in");
        mockMvc.perform(get("/api/admin/users").header("Authorization", bearer(adminToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2));
    }

    @Test
    void dashboardReturnsCountsAndRecentActivity() throws Exception {
        String token = registerStudent("dashboard@klu.ac.in", "KLU-2501");

        mockMvc.perform(post("/api/posts")
                        .header("Authorization", bearer(token))
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "title", "My first post",
                                "content", "This is a post created for dashboard verification."))))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/dashboard").header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.postCount").value(1))
                .andExpect(jsonPath("$.noteCount").value(0))
                .andExpect(jsonPath("$.questionCount").value(0))
                .andExpect(jsonPath("$.recentActivity[0].type").value("POST"));
    }
}
