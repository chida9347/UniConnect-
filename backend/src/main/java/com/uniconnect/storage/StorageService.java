package com.uniconnect.storage;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

/**
 * Storage abstraction. The default implementation writes to a mounted filesystem
 * path. The S3 implementation can be enabled for persistent object storage.
 */
public interface StorageService {

    void store(MultipartFile file, String key);

    Resource load(String key);

    void delete(String key);
}
