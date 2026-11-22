package com.uniconnect.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

/**
 * Multipart variant of {@link PostRequest} used when a post includes images.
 */
public class PostUploadRequest {

    @NotBlank(message = "Post title is required")
    @Size(min = 3, max = 180, message = "Title must be between 3 and 180 characters")
    private String title;

    @NotBlank(message = "Post content is required")
    @Size(min = 10, max = 10000, message = "Content must be between 10 and 10,000 characters")
    private String content;

    private List<MultipartFile> images = new ArrayList<>();

    /** Image ids to detach while editing a post. */
    private List<Long> removedImageIds = new ArrayList<>();

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public List<MultipartFile> getImages() {
        return images;
    }

    public void setImages(List<MultipartFile> images) {
        this.images = images;
    }

    public List<Long> getRemovedImageIds() {
        return removedImageIds;
    }

    public void setRemovedImageIds(List<Long> removedImageIds) {
        this.removedImageIds = removedImageIds;
    }
}
