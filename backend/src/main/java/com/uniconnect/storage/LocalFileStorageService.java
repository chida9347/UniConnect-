package com.uniconnect.storage;

import com.uniconnect.exception.BadRequestException;
import com.uniconnect.exception.NotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

@Service
@ConditionalOnProperty(name = "app.storage.type", havingValue = "local", matchIfMissing = true)
public class LocalFileStorageService implements StorageService {

    private static final Logger log = LoggerFactory.getLogger(LocalFileStorageService.class);
    private final Path root;

    public LocalFileStorageService(@Value("${app.storage.local-path}") String storagePath) {
        this.root = Path.of(storagePath).toAbsolutePath().normalize();
        try {
            Files.createDirectories(root);
            log.info("Local file storage initialized at {}", root);
        } catch (IOException exception) {
            throw new IllegalStateException("Could not initialize upload directory " + root, exception);
        }
    }

    @Override
    public void store(MultipartFile file, String key) {
        Path target = resolveSafe(key);
        try {
            Files.createDirectories(target.getParent());
            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, target, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException exception) {
            throw new IllegalStateException("Could not store uploaded file", exception);
        }
    }

    @Override
    public Resource load(String key) {
        Path target = resolveSafe(key);
        try {
            Resource resource = new UrlResource(target.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new NotFoundException("Stored file could not be found");
            }
            return resource;
        } catch (IOException exception) {
            throw new NotFoundException("Stored file could not be found");
        }
    }

    @Override
    public void delete(String key) {
        try {
            Files.deleteIfExists(resolveSafe(key));
        } catch (IOException exception) {
            log.warn("Could not delete stored file {}: {}", key, exception.getMessage());
        }
    }

    private Path resolveSafe(String key) {
        Path target = root.resolve(key).normalize();
        if (!target.startsWith(root)) {
            throw new BadRequestException("Invalid storage key");
        }
        return target;
    }
}
