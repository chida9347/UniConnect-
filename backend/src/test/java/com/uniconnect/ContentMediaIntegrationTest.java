package com.uniconnect;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ContentMediaIntegrationTest extends BaseIntegrationTest {

    @Test
    void postsSupportImagesWithOwnershipChecks() throws Exception {
        String ownerToken = registerStudent("images.owner@klu.ac.in", "KLU-3001");
        String readerToken = registerStudent("images.reader@klu.ac.in", "KLU-3002");
        byte[] png = new byte[]{(byte) 0x89, 'P', 'N', 'G', 1, 2, 3};

        MvcResult created = mockMvc.perform(multipart("/api/posts")
                        .file(new MockMultipartFile("images", "campus.png", "image/png", png))
                        .param("title", "Campus photo")
                        .param("content", "A picture from the library terrace during exam week.")
                        .header("Authorization", bearer(ownerToken)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.images.length()").value(1))
                .andExpect(jsonPath("$.images[0].originalFilename").value("campus.png"))
                .andExpect(jsonPath("$.images[0].url").value(org.hamcrest.Matchers.containsString("/api/posts/images/")))
                .andReturn();
        long postId = idFrom(created);
        long imageId = objectMapper.readTree(created.getResponse().getContentAsString())
                .get("images").get(0).get("id").asLong();

        mockMvc.perform(get("/api/posts/images/" + imageId).header("Authorization", bearer(readerToken)))
                .andExpect(status().isOk())
                .andExpect(content().contentType("image/png"))
                .andExpect(content().bytes(png));

        mockMvc.perform(get("/api/posts").header("Authorization", bearer(readerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].images[0].id").value(imageId));

        org.springframework.test.web.servlet.request.MockMultipartHttpServletRequestBuilder tooMany =
                multipart(HttpMethod.PUT, "/api/posts/" + postId);
        for (int i = 1; i <= 4; i++) {
            tooMany.file(new MockMultipartFile("images", "extra-" + i + ".png", "image/png", png));
        }
        mockMvc.perform(tooMany
                        .param("title", "Too many images")
                        .param("content", "This edit tries to keep one existing image and add four more.")
                        .header("Authorization", bearer(ownerToken)))
                .andExpect(status().isBadRequest());

        mockMvc.perform(multipart(HttpMethod.PUT, "/api/posts/" + postId)
                        .file(new MockMultipartFile("images", "second.png", "image/png", png))
                        .param("title", "Changed title")
                        .param("content", "Another valid description for the same campus photo post.")
                        .header("Authorization", bearer(readerToken)))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/posts/" + postId + "/images/" + imageId)
                        .header("Authorization", bearer(readerToken)))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/posts/" + postId + "/images/" + imageId)
                        .header("Authorization", bearer(ownerToken)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/posts/images/" + imageId).header("Authorization", bearer(ownerToken)))
                .andExpect(status().isNotFound());
    }

    @Test
    void studyFoldersGroupUploadsAndRestrictDeletion() throws Exception {
        String ownerToken = registerStudent("folders.owner@klu.ac.in", "KLU-3101");
        String otherToken = registerStudent("folders.other@klu.ac.in", "KLU-3102");

        MvcResult folder = mockMvc.perform(post("/api/note-folders")
                        .header("Authorization", bearer(ownerToken))
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(Map.of("name", "DBMS"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("DBMS"))
                .andExpect(jsonPath("$.noteCount").value(0))
                .andReturn();
        long folderId = idFrom(folder);

        mockMvc.perform(post("/api/note-folders")
                        .header("Authorization", bearer(otherToken))
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(Map.of("name", "dbms"))))
                .andExpect(status().isConflict());

        mockMvc.perform(get("/api/note-folders").header("Authorization", bearer(otherToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("DBMS"));

        MvcResult note = mockMvc.perform(multipart("/api/notes")
                        .file(new MockMultipartFile("file", "dbms-unit-1.pdf", "application/pdf", "%PDF test".getBytes()))
                        .param("title", "DBMS Unit 1 notes")
                        .param("folderId", String.valueOf(folderId))
                        .header("Authorization", bearer(ownerToken)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.folderId").value(folderId))
                .andExpect(jsonPath("$.folderName").value("DBMS"))
                .andExpect(jsonPath("$.subject").value("DBMS"))
                .andExpect(jsonPath("$.downloadUrl").exists())
                .andReturn();
        long noteId = idFrom(note);

        mockMvc.perform(get("/api/notes").param("folderId", String.valueOf(folderId))
                        .header("Authorization", bearer(otherToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1));

        mockMvc.perform(get("/api/notes").param("folderId", String.valueOf(folderId))
                        .param("search", "unit 1")
                        .header("Authorization", bearer(otherToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1));

        mockMvc.perform(get("/api/notes").param("folderId", "999999")
                        .header("Authorization", bearer(otherToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0));

        mockMvc.perform(multipart("/api/notes")
                        .file(new MockMultipartFile("file", "loose.txt", "text/plain", "notes".getBytes()))
                        .param("title", "No folder and no subject")
                        .header("Authorization", bearer(ownerToken)))
                .andExpect(status().isBadRequest());

        mockMvc.perform(delete("/api/note-folders/" + folderId).header("Authorization", bearer(otherToken)))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/note-folders/" + folderId).header("Authorization", bearer(ownerToken)))
                .andExpect(status().isConflict());

        mockMvc.perform(delete("/api/notes/" + noteId).header("Authorization", bearer(ownerToken)))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/note-folders/" + folderId).header("Authorization", bearer(ownerToken)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/note-folders").header("Authorization", bearer(ownerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }
}
