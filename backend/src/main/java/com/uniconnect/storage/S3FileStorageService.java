package com.uniconnect.storage;

import com.uniconnect.exception.NotFoundException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

import java.io.IOException;
import java.net.URI;

@Service
@ConditionalOnProperty(name = "app.storage.type", havingValue = "s3")
public class S3FileStorageService implements StorageService {

    private final S3Client s3Client;
    private final String bucket;
    private final String pathPrefix;

    public S3FileStorageService(
            @Value("${app.storage.s3.bucket}") String bucket,
            @Value("${app.storage.s3.region:us-east-1}") String region,
            @Value("${app.storage.s3.endpoint:}") String endpoint,
            @Value("${app.storage.s3.access-key}") String accessKey,
            @Value("${app.storage.s3.secret-key}") String secretKey,
            @Value("${app.storage.s3.path-prefix:uniconnect}") String pathPrefix
    ) {
        this.bucket = bucket;
        this.pathPrefix = pathPrefix;
        var builder = S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)));
        if (endpoint != null && !endpoint.isBlank()) {
            builder.endpointOverride(URI.create(endpoint));
            builder.forcePathStyle(true);
        }
        this.s3Client = builder.build();
    }

    @Override
    public void store(MultipartFile file, String key) {
        try {
            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(objectKey(key))
                    .contentType(file.getContentType())
                    .contentLength(file.getSize())
                    .build();
            s3Client.putObject(request, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
        } catch (IOException | S3Exception exception) {
            throw new IllegalStateException("Could not upload file to object storage", exception);
        }
    }

    @Override
    public Resource load(String key) {
        try {
            ResponseInputStream<GetObjectResponse> stream = s3Client.getObject(GetObjectRequest.builder()
                    .bucket(bucket)
                    .key(objectKey(key))
                    .build());
            return new InputStreamResource(stream);
        } catch (S3Exception exception) {
            throw new NotFoundException("Stored file could not be found");
        }
    }

    @Override
    public void delete(String key) {
        try {
            s3Client.deleteObject(DeleteObjectRequest.builder()
                    .bucket(bucket)
                    .key(objectKey(key))
                    .build());
        } catch (S3Exception ignored) {
            // Deletion is best effort. A missing object should not block database cleanup.
        }
    }

    private String objectKey(String key) {
        return pathPrefix == null || pathPrefix.isBlank() ? key : pathPrefix + "/" + key;
    }
}
