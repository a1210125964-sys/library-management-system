package com.lms.repository;

import com.lms.model.BookCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BookCategoryRepository extends JpaRepository<BookCategory, Long> {
    boolean existsByNameIgnoreCase(String name);
    Optional<BookCategory> findByNameIgnoreCase(String name);
    List<BookCategory> findAllByOrderByNameAsc();
}
