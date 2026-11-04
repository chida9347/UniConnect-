package com.uniconnect.service;

import com.uniconnect.dto.PageResponse;
import com.uniconnect.dto.PostRequest;
import com.uniconnect.dto.PostResponse;
import com.uniconnect.entity.Post;
import com.uniconnect.entity.User;
import com.uniconnect.exception.NotFoundException;
import com.uniconnect.repository.PostRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class PostService {

    private final PostRepository postRepository;
    private final CurrentUserService currentUserService;

    public PostService(PostRepository postRepository, CurrentUserService currentUserService) {
        this.postRepository = postRepository;
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
    public PostResponse update(Long id, PostRequest request) {
        Post post = findPost(id);
        currentUserService.requireOwnerOrAdmin(post.getAuthor());
        post.setTitle(request.title().trim());
        post.setContent(request.content().trim());
        return Mappers.toPost(postRepository.save(post));
    }

    @Transactional
    public void delete(Long id) {
        Post post = findPost(id);
        currentUserService.requireOwnerOrAdmin(post.getAuthor());
        postRepository.delete(post);
    }

    private Post findPost(Long id) {
        return postRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Post not found"));
    }
}
