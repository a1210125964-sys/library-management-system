package com.lms.repository;

import com.lms.model.Notice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NoticeRepository extends JpaRepository<Notice, Long> {
    Page<Notice> findByPublishedTrue(Pageable pageable);
    long countByPublishedTrue();
}