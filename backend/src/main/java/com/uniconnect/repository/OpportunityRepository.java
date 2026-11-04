package com.uniconnect.repository;

import com.uniconnect.entity.Opportunity;
import com.uniconnect.entity.OpportunityCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;

public interface OpportunityRepository extends JpaRepository<Opportunity, Long> {

    @Query("""
            SELECT o FROM Opportunity o
            WHERE (:search IS NULL OR :search = ''
                   OR LOWER(o.title) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(o.description) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(o.organization) LIKE LOWER(CONCAT('%', :search, '%')))
              AND (:category IS NULL OR o.category = :category)
              AND (:upcomingOnly = false OR o.deadline >= :today)
            """)
    Page<Opportunity> search(
            @Param("search") String search,
            @Param("category") OpportunityCategory category,
            @Param("upcomingOnly") boolean upcomingOnly,
            @Param("today") LocalDate today,
            Pageable pageable);

    long countByDeadlineGreaterThanEqual(LocalDate date);
}
