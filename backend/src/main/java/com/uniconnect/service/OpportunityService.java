package com.uniconnect.service;

import com.uniconnect.dto.OpportunityRequest;
import com.uniconnect.dto.OpportunityResponse;
import com.uniconnect.dto.PageResponse;
import com.uniconnect.entity.Opportunity;
import com.uniconnect.entity.OpportunityCategory;
import com.uniconnect.entity.User;
import com.uniconnect.exception.NotFoundException;
import com.uniconnect.repository.OpportunityRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
public class OpportunityService {

    private final OpportunityRepository opportunityRepository;
    private final CurrentUserService currentUserService;

    public OpportunityService(OpportunityRepository opportunityRepository, CurrentUserService currentUserService) {
        this.opportunityRepository = opportunityRepository;
        this.currentUserService = currentUserService;
    }

    @Transactional(readOnly = true)
    public PageResponse<OpportunityResponse> list(String search, OpportunityCategory category,
                                                  boolean upcomingOnly, int page, int size) {
        Page<Opportunity> opportunities = opportunityRepository.search(
                search == null ? "" : search.trim(),
                category,
                upcomingOnly,
                LocalDate.now(),
                PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 50),
                        Sort.by(Sort.Direction.ASC, "deadline")));
        return PageResponse.from(opportunities, Mappers::toOpportunity);
    }

    @Transactional(readOnly = true)
    public OpportunityResponse get(Long id) {
        return Mappers.toOpportunity(findOpportunity(id));
    }

    @Transactional
    public OpportunityResponse create(OpportunityRequest request) {
        User admin = currentUserService.requireCurrentUser();
        Opportunity opportunity = new Opportunity();
        apply(opportunity, request);
        opportunity.setPostedBy(admin);
        return Mappers.toOpportunity(opportunityRepository.save(opportunity));
    }

    @Transactional
    public OpportunityResponse update(Long id, OpportunityRequest request) {
        Opportunity opportunity = findOpportunity(id);
        apply(opportunity, request);
        return Mappers.toOpportunity(opportunityRepository.save(opportunity));
    }

    @Transactional
    public void delete(Long id) {
        opportunityRepository.delete(findOpportunity(id));
    }

    private void apply(Opportunity opportunity, OpportunityRequest request) {
        opportunity.setTitle(request.title().trim());
        opportunity.setDescription(request.description().trim());
        opportunity.setCategory(request.category());
        opportunity.setOrganization(request.organization().trim());
        opportunity.setApplicationUrl(request.applicationUrl().trim());
        opportunity.setDeadline(request.deadline());
    }

    private Opportunity findOpportunity(Long id) {
        return opportunityRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Opportunity not found"));
    }
}
