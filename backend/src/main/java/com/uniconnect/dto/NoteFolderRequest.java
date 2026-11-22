package com.uniconnect.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record NoteFolderRequest(
        @NotBlank(message = "Folder name is required")
        @Size(min = 2, max = 80, message = "Folder name must be between 2 and 80 characters")
        String name
) {
}
