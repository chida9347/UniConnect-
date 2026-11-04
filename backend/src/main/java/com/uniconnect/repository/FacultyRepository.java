package com.uniconnect.repository;

import com.uniconnect.entity.Faculty;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface FacultyRepository extends JpaRepository<Faculty, Long> {

    @Query("""
            SELECT f FROM Faculty f
            WHERE (:search IS NULL OR :search = ''
                   OR LOWER(f.name) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(f.designation) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(f.specialization) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(f.department) LIKE LOWER(CONCAT('%', :search, '%')))
              AND (:department IS NULL OR :department = '' OR f.department = :department)
            """)
    Page<Faculty> search(
            @Param("search") String search,
            @Param("department") String department,
            Pageable pageable);

    @Query("SELECT DISTINCT f.department FROM Faculty f ORDER BY f.department")
    List<String> findDistinctDepartments();
}
