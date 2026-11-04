package com.uniconnect;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.uniconnect.entity.Role;
import com.uniconnect.entity.User;
import com.uniconnect.repository.AnswerRepository;
import com.uniconnect.repository.FacultyRepository;
import com.uniconnect.repository.NoteRepository;
import com.uniconnect.repository.OpportunityRepository;
import com.uniconnect.repository.PostRepository;
import com.uniconnect.repository.QuestionRepository;
import com.uniconnect.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public abstract class BaseIntegrationTest {

    @Autowired
    protected MockMvc mockMvc;
    @Autowired
    protected ObjectMapper objectMapper;
    @Autowired
    protected UserRepository userRepository;
    @Autowired
    protected PostRepository postRepository;
    @Autowired
    protected NoteRepository noteRepository;
    @Autowired
    protected QuestionRepository questionRepository;
    @Autowired
    protected AnswerRepository answerRepository;
    @Autowired
    protected FacultyRepository facultyRepository;
    @Autowired
    protected OpportunityRepository opportunityRepository;
    @Autowired
    protected PasswordEncoder passwordEncoder;

    @BeforeEach
    void cleanDatabase() {
        answerRepository.deleteAll();
        questionRepository.deleteAll();
        noteRepository.deleteAll();
        postRepository.deleteAll();
        opportunityRepository.deleteAll();
        facultyRepository.deleteAll();
        userRepository.deleteAll();
    }

    protected String registerStudent(String email, String universityId) throws Exception {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("fullName", "Test Student");
        payload.put("universityId", universityId);
        payload.put("email", email);
        payload.put("password", "Test@12345");
        payload.put("confirmPassword", "Test@12345");
        payload.put("department", "Computer Science and Engineering");
        payload.put("academicYear", "3rd Year");

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isCreated())
                .andReturn();
        return tokenFrom(result);
    }

    protected String login(String email, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", email,
                                "password", password))))
                .andExpect(status().isOk())
                .andReturn();
        return tokenFrom(result);
    }

    protected String createAdminAndLogin(String email) throws Exception {
        User admin = new User();
        admin.setFullName("Test Administrator");
        admin.setEmail(email);
        admin.setUniversityId("ADM-" + System.nanoTime());
        admin.setPasswordHash(passwordEncoder.encode("Admin@12345"));
        admin.setDepartment("Administration");
        admin.setAcademicYear("Administration");
        admin.setRole(Role.ADMIN);
        userRepository.save(admin);
        return login(email, "Admin@12345");
    }

    protected User findUser(String email) {
        return userRepository.findByEmailIgnoreCase(email).orElseThrow();
    }

    protected String tokenFrom(MvcResult result) throws Exception {
        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        return json.get("token").asText();
    }

    protected String bearer(String token) {
        return "Bearer " + token;
    }

    protected long idFrom(MvcResult result) throws Exception {
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }

    protected Instant now() {
        return Instant.now();
    }
}
