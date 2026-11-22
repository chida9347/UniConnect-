package com.uniconnect.service;

import com.uniconnect.dto.PageResponse;
import com.uniconnect.dto.PostRequest;
import com.uniconnect.dto.PostResponse;
import com.uniconnect.dto.PostUploadRequest;
import com.uniconnect.entity.Post;
import com.uniconnect.entity.PostImage;
import com.uniconnect.entity.User;
import com.uniconnect.exception.BadRequestException;
import com.uniconnect.exception.NotFoundException;
import com.uniconnect.repository.PostImageRepository;
import com.uniconnect.repository.PostRepository;
import com.uniconnect.storage.StorageService;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class PostService {

    private static final int MAX_IMAGES = 4;
    private static final long MAX_IMAGE_SIZE = 5L * 1024 * 1024;
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("png", "jpg", "jpeg", "gif", "webp");
    private static final Map<String, String> CONTENT_TYPES = Map.of(
            "png", "image/png",
            "jpg", "image/jpeg",
            "jpeg", "image/jpeg",
            "gif", "image/gif",
            "webp", "image/webp"
    );

    private final PostRepository postRepository;
    private final PostImageRepository postImageRepository;
    private final StorageService storageService;
    private final CurrentUserService currentUserService;

    public PostService(PostRepository postRepository, PostImageRepository postImageRepository,
                       StorageService storageService, CurrentUserService currentUserService) {
        this.postRepository = postRepository;
        this.postImageRepository = postImageRepository;
        this.storageService = storageService;
        this.currentUserService = currentUserService;
    }

    @Transactional(readOnly = true)
    public PageResponse<PostResponse> list(String search, int page, int size, String sort) {
        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.min(Math.max(size, 1), 50),
                Sort.by("oldest".equalsIgnoreCase(sort) ? Sort.Direction.ASC : Sort.Direction.DESC, "createdAt"));
        Page<Post> posts;
        if (StringUtils.hasText(search)) {
            String term = search.trim();
            posts = postRepository.findByTitleContainingIgnoreCaseOrContentContainingIgnoreCase(term, term, pageable);
        } else {
            posts = postRepository.findAll(pageable);
        }
        return PageResponse.from(posts, Mappers::toPost);
    }

    @Transactional(readOnly = true)
    public PostResponse get(Long id) {
        return Mappers.toPost(findPost(id));
    }

    @Transactional
    public PostResponse create(PostRequest request) {
        User author = currentUserService.requireCurrentUser();
        Post post = new Post();
        post.setTitle(request.title().trim());
        post.setContent(request.content().trim());
        post.setAuthor(author);
        return Mappers.toPost(postRepository.save(post));
    }

    @Transactional
    public PostResponse createWithImages(PostUploadRequest request) {
        List<MultipartFile> files = validImages(request.getImages());
        Post post = new Post();
        post.setTitle(request.getTitle().trim());
        post.setContent(request.getContent().trim());
        post.setAuthor(currentUserService.requireCurrentUser());
        post = postRepository.save(post);

        List<PostImage> stored = new ArrayList<>();
        try {
            for (MultipartFile file : files) {
                PostImage image = storeImage(file);
                image.setPost(post);
                stored.add(postImageRepository.save(image));
            }
        } catch (RuntimeException exception) {
            stored.forEach(image -> storageService.delete(image.getStorageKey()));
            throw exception;
        }
        post.getImages().addAll(stored);
        return Mappers.toPost(post);
    }

    @Transactional
    public PostResponse update(Long id, PostRequest request) {
        Post post = findPost(id);
        currentUserService.requireOwnerOrAdmin(post.getAuthor());
        post.setTitle(request.title().trim());
        post.setContent(request.content().trim());
        return Mappers.toPost(postRepository.save(post));
    }

    @Transactional
    public PostResponse updateWithImages(Long id, PostUploadRequest request) {
        Post post = findPost(id);
        currentUserService.requireOwnerOrAdmin(post.getAuthor());
        post.setTitle(request.getTitle().trim());
        post.setContent(request.getContent().trim());

        if (request.getRemovedImageIds() != null && !request.getRemovedImageIds().isEmpty()) {
            for (Long imageId : request.getRemovedImageIds()) {
                removeImageFromPost(post, imageId);
            }
        }

        List<MultipartFile> files = validImages(request.getImages());
        long retained = post.getImages().stream()
                .filter(image -> request.getRemovedImageIds() == null
                        || !request.getRemovedImageIds().contains(image.getId()))
                .count();
        if (retained + files.size() > MAX_IMAGES) {
            throw new BadRequestException("A post can have at most " + MAX_IMAGES + " images");
        }

        List<PostImage> stored = new ArrayList<>();
        try {
            for (MultipartFile file : files) {
                PostImage image = storeImage(file);
                image.setPost(post);
                stored.add(postImageRepository.save(image));
            }
        } catch (RuntimeException exception) {
            stored.forEach(image -> storageService.delete(image.getStorageKey()));
            throw exception;
        }
        post.getImages().addAll(stored);
        return Mappers.toPost(postRepository.save(post));
    }

    @Transactional
    public void removeImage(Long postId, Long imageId) {
        Post post = findPost(postId);
        currentUserService.requireOwnerOrAdmin(post.getAuthor());
        removeImageFromPost(post, imageId);
    }

    @Transactional(readOnly = true)
    public ImageDownload loadImage(Long imageId) {
        PostImage image = postImageRepository.findById(imageId)
                .orElseThrow(() -> new NotFoundException("Post image not found"));
        return new ImageDownload(image, storageService.load(image.getStorageKey()));
    }

    @Transactional
    public void delete(Long id) {
        Post post = findPost(id);
        currentUserService.requireOwnerOrAdmin(post.getAuthor());
        List<String> keys = post.getImages().stream().map(PostImage::getStorageKey).toList();
        postRepository.delete(post);
        keys.forEach(storageService::delete);
    }

    private void removeImageFromPost(Post post, Long imageId) {
        PostImage image = postImageRepository.findById(imageId)
                .orElseThrow(() -> new NotFoundException("Post image not found"));
        if (!image.getPost().getId().equals(post.getId())) {
            throw new BadRequestException("This image does not belong to the post");
        }
        post.getImages().removeIf(candidate -> candidate.getId().equals(imageId));
        storageService.delete(image.getStorageKey());
    }

    private List<MultipartFile> validImages(List<MultipartFile> images) {
        if (images == null || images.isEmpty()) {
            return List.of();
        }
        List<MultipartFile> files = images.stream()
                .filter(image -> image != null && !image.isEmpty())
                .toList();
        if (files.size() > MAX_IMAGES) {
            throw new BadRequestException("A post can have at most " + MAX_IMAGES + " images");
        }
        for (MultipartFile file : files) {
            if (file.getSize() > MAX_IMAGE_SIZE) {
                throw new BadRequestException("Each image must be 5 MB or smaller");
            }
            String extension = StringUtils.getFilenameExtension(sanitizeFilename(file.getOriginalFilename()));
            if (extension == null || !ALLOWED_EXTENSIONS.contains(extension.toLowerCase(Locale.ROOT))) {
                throw new BadRequestException("Unsupported image type. Upload a PNG, JPG, GIF or WebP file");
            }
        }
        return files;
    }

    private PostImage storeImage(MultipartFile file) {
        String originalFilename = sanitizeFilename(file.getOriginalFilename());
        String extension = StringUtils.getFilenameExtension(originalFilename).toLowerCase(Locale.ROOT);
        String storageKey = "posts/" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM"))
                + "/" + UUID.randomUUID() + "." + extension;
        storageService.store(file, storageKey);

        PostImage image = new PostImage();
        image.setStorageKey(storageKey);
        image.setOriginalFilename(originalFilename);
        image.setContentType(CONTENT_TYPES.get(extension));
        image.setFileSize(file.getSize());
        return image;
    }

    private String sanitizeFilename(String filename) {
        if (!StringUtils.hasText(filename)) {
            throw new BadRequestException("The uploaded image must have a filename");
        }
        String cleaned = StringUtils.cleanPath(filename);
        if (cleaned.contains("..")) {
            throw new BadRequestException("Invalid filename");
        }
        return cleaned.replaceAll("[\\\\/:*?\"<>|]", "_");
    }

    private Post findPost(Long id) {
        return postRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Post not found"));
    }

    public record ImageDownload(PostImage image, Resource resource) {
    }
}
