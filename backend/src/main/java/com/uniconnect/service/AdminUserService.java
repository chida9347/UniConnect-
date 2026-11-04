package com.uniconnect.service;

import com.uniconnect.dto.PageResponse;
import com.uniconnect.dto.UserResponse;
import com.uniconnect.entity.Role;
import com.uniconnect.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminUserService {

    private final UserRepository userRepository;

    public AdminUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<UserResponse> list(String search, Role role, int page, int size) {
        var users = userRepository.search(
                search == null ? "" : search.trim(),
                role,
                PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100),
                        Sort.by(Sort.Direction.DESC, "createdAt")));
        return PageResponse.from(users, Mappers::toUser);
    }
}
