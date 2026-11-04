package com.uniconnect.controller;

import com.uniconnect.dto.FacultyRequest;
import com.uniconnect.dto.FacultyResponse;
import com.uniconnect.dto.MessageResponse;
import com.uniconnect.dto.PageResponse;
import com.uniconnect.service.FacultyService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/faculty")
public class FacultyController {

    private final FacultyService facultyService;

    public FacultyController(FacultyService facultyService) {
        this.facultyService = facultyService;
    }

    @GetMapping
    public ResponseEntity<PageResponse<FacultyResponse>> list(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "") String department,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        return ResponseEntity.ok(facultyService.list(search, department, page, size));
    }

    @GetMapping("/departments")
    public ResponseEntity<List<String>> departments() {
        return ResponseEntity.ok(facultyService.departments());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FacultyResponse> create(@Valid @RequestBody FacultyRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(facultyService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FacultyResponse> update(@PathVariable Long id,
                                                  @Valid @RequestBody FacultyRequest request) {
        return ResponseEntity.ok(facultyService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MessageResponse> delete(@PathVariable Long id) {
        facultyService.delete(id);
        return ResponseEntity.ok(new MessageResponse("Faculty record deleted"));
    }
}
