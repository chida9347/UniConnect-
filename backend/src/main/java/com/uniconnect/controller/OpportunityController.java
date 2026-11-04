package com.uniconnect.controller;

import com.uniconnect.dto.MessageResponse;
import com.uniconnect.dto.OpportunityRequest;
import com.uniconnect.dto.OpportunityResponse;
import com.uniconnect.dto.PageResponse;
import com.uniconnect.entity.OpportunityCategory;
import com.uniconnect.service.OpportunityService;
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

@RestController
@RequestMapping("/api/opportunities")
public class OpportunityController {

    private final OpportunityService opportunityService;

    public OpportunityController(OpportunityService opportunityService) {
        this.opportunityService = opportunityService;
    }

    @GetMapping
    public ResponseEntity<PageResponse<OpportunityResponse>> list(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(required = false) OpportunityCategory category,
            @RequestParam(defaultValue = "false") boolean upcomingOnly,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        return ResponseEntity.ok(opportunityService.list(search, category, upcomingOnly, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OpportunityResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(opportunityService.get(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<OpportunityResponse> create(@Valid @RequestBody OpportunityRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(opportunityService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<OpportunityResponse> update(@PathVariable Long id,
                                                      @Valid @RequestBody OpportunityRequest request) {
        return ResponseEntity.ok(opportunityService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MessageResponse> delete(@PathVariable Long id) {
        opportunityService.delete(id);
        return ResponseEntity.ok(new MessageResponse("Opportunity deleted"));
    }
}
