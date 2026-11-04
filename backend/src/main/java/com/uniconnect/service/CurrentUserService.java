package com.uniconnect.service;

import com.uniconnect.entity.Role;
import com.uniconnect.entity.User;
import com.uniconnect.exception.NotFoundException;
import com.uniconnect.repository.UserRepository;
import com.uniconnect.security.UserPrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class CurrentUserService {

    private final UserRepository userRepository;

    public CurrentUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User requireCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            throw new NotFoundException("Authenticated user could not be resolved");
        }
        return userRepository.findById(principal.getId())
                .orElseThrow(() -> new NotFoundException("Authenticated user no longer exists"));
    }

    public boolean isAdmin(User user) {
        return user.getRole() == Role.ADMIN;
    }

    public void requireOwnerOrAdmin(User owner) {
        User current = requireCurrentUser();
        if (!current.getId().equals(owner.getId()) && !isAdmin(current)) {
            throw new com.uniconnect.exception.ForbiddenException("You can only manage content that you own");
        }
    }
}
