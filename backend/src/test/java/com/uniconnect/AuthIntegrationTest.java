package com.uniconnect;

import com.uniconnect.security.JwtService;
import com.uniconnect.security.UserPrincipal;
import org.junit.jupiter.api.Test;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.http.MediaType.APPLICATION_JSON;

class AuthIntegrationTest extends BaseIntegrationTest {

    @Test
    void registrationAndLoginWorkWithHashedPassword() throws Exception {
        registerStudent("student1@klu.ac.in", "KLU-1001");
        String token = login("student1@klu.ac.in", "Test@12345");

        mockMvc.perform(get("/api/auth/me").header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("student1@klu.ac.in"))
                .andExpect(jsonPath("$.role").value("STUDENT"))
                .andExpect(jsonPath("$.password").doesNotExist());

        var user = findUser("student1@klu.ac.in");
        org.junit.jupiter.api.Assertions.assertNotEquals("Test@12345", user.getPasswordHash());
        org.junit.jupiter.api.Assertions.assertTrue(user.getPasswordHash().startsWith("$2"));
    }

    @Test
    void duplicateUniversityIdIsRejected() throws Exception {
        registerStudent("student1@klu.ac.in", "KLU-1001");

        Map<String, Object> payload = validRegistration("student2@klu.ac.in", "KLU-1001");
        mockMvc.perform(post("/api/auth/register")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("An account with this university ID already exists"));
    }

    @Test
    void duplicateEmailIsRejected() throws Exception {
        registerStudent("student1@klu.ac.in", "KLU-1001");

        Map<String, Object> payload = validRegistration("STUDENT1@klu.ac.in", "KLU-1002");
        mockMvc.perform(post("/api/auth/register")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isConflict());
    }

    @Test
    void nonUniversityEmailAndWeakPasswordAreRejected() throws Exception {
        Map<String, Object> emailPayload = validRegistration("student@gmail.com", "KLU-1001");
        mockMvc.perform(post("/api/auth/register")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(emailPayload)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.email").exists());

        Map<String, Object> weakPayload = validRegistration("student2@klu.ac.in", "KLU-1002");
        weakPayload.put("password", "weak");
        weakPayload.put("confirmPassword", "weak");
        mockMvc.perform(post("/api/auth/register")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(weakPayload)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.password").exists());
    }

    @Test
    void incorrectPasswordAndUnknownAccountReturnUnauthorized() throws Exception {
        registerStudent("student1@klu.ac.in", "KLU-1001");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "student1@klu.ac.in", "password", "Wrong@12345"))))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "nobody@klu.ac.in", "password", "Wrong@12345"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void protectedEndpointsRejectMissingInvalidAndExpiredTokens() throws Exception {
        mockMvc.perform(get("/api/posts"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/posts").header("Authorization", "Bearer not-a-token"))
                .andExpect(status().isUnauthorized());

        registerStudent("student1@klu.ac.in", "KLU-1001");
        UserPrincipal principal = UserPrincipal.from(findUser("student1@klu.ac.in"));
        JwtService expiredJwtService = new JwtService(
                "test-only-secret-key-with-more-than-32-characters", -60000);
        String expiredToken = expiredJwtService.generateToken(principal);

        mockMvc.perform(get("/api/posts").header("Authorization", bearer(expiredToken)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void profileUpdateCannotChangeProtectedFields() throws Exception {
        String token = registerStudent("student1@klu.ac.in", "KLU-1001");
        var original = findUser("student1@klu.ac.in");

        Map<String, Object> payload = Map.of(
                "fullName", "Updated Name",
                "department", "Information Technology",
                "academicYear", "4th Year",
                "email", "attacker@klu.ac.in",
                "role", "ADMIN",
                "universityId", "HACKED-1"
        );

        mockMvc.perform(put("/api/profile")
                        .header("Authorization", bearer(token))
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Updated Name"))
                .andExpect(jsonPath("$.email").value(original.getEmail()))
                .andExpect(jsonPath("$.role").value("STUDENT"))
                .andExpect(jsonPath("$.universityId").value(original.getUniversityId()));
    }

    private Map<String, Object> validRegistration(String email, String universityId) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("fullName", "Test Student");
        payload.put("universityId", universityId);
        payload.put("email", email);
        payload.put("password", "Test@12345");
        payload.put("confirmPassword", "Test@12345");
        payload.put("department", "Computer Science and Engineering");
        payload.put("academicYear", "3rd Year");
        return payload;
    }
}
