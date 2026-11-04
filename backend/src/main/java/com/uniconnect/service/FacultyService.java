package com.uniconnect.service;

import com.uniconnect.dto.FacultyRequest;
import com.uniconnect.dto.FacultyResponse;
import com.uniconnect.dto.PageResponse;
import com.uniconnect.entity.Faculty;
import com.uniconnect.exception.NotFoundException;
import com.uniconnect.repository.FacultyRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class FacultyService {

    private final FacultyRepository facultyRepository;

    public FacultyService(FacultyRepository facultyRepository) {
        this.facultyRepository = facultyRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<FacultyResponse> list(String search, String department, int page, int size) {
        Page<Faculty> faculty = facultyRepository.search(
                search == null ? "" : search.trim(),
                department == null ? "" : department.trim(),
                PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100),
                        Sort.by(Sort.Direction.ASC, "name")));
        return PageResponse.from(faculty, Mappers::toFaculty);
    }

    @Transactional(readOnly = true)
    public List<String> departments() {
        return facultyRepository.findDistinctDepartments();
    }

    @Transactional
    public FacultyResponse create(FacultyRequest request) {
        Faculty faculty = new Faculty();
        apply(faculty, request);
        return Mappers.toFaculty(facultyRepository.save(faculty));
    }

    @Transactional
    public FacultyResponse update(Long id, FacultyRequest request) {
        Faculty faculty = findFaculty(id);
        apply(faculty, request);
        return Mappers.toFaculty(facultyRepository.save(faculty));
    }

    @Transactional
    public void delete(Long id) {
        facultyRepository.delete(findFaculty(id));
    }

    private void apply(Faculty faculty, FacultyRequest request) {
        faculty.setName(request.name().trim());
        faculty.setDepartment(request.department().trim());
        faculty.setDesignation(request.designation().trim());
        faculty.setEmail(request.email().trim().toLowerCase());
        faculty.setSpecialization(request.specialization().trim());
        faculty.setContactInfo(request.contactInfo() == null ? null : request.contactInfo().trim());
    }

    private Faculty findFaculty(Long id) {
        return facultyRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Faculty record not found"));
    }
}
