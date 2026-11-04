package com.uniconnect.service;

import com.uniconnect.dto.UpdateProfileRequest;
import com.uniconnect.dto.UserResponse;
import com.uniconnect.entity.User;
import com.uniconnect.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProfileService {

    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;

    public ProfileService(UserRepository userRepository, CurrentUserService currentUserService) {
        this.userRepository = userRepository;
        this.currentUserService = currentUserService;
    }

    @Transactional(readOnly = true)
    public UserResponse getProfile() {
        return Mappers.toUser(currentUserService.requireCurrentUser());
    }

    @Transactional
    public UserResponse updateProfile(UpdateProfileRequest request) {
        User user = currentUserService.requireCurrentUser();
        user.setFullName(request.fullName().trim());
        user.setDepartment(request.department().trim());
        user.setAcademicYear(request.academicYear().trim());
        // Email, university ID, and role are protected and deliberately not updated here.
        return Mappers.toUser(userRepository.save(user));
    }
}
