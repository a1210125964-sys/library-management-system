package com.lms.repository;

import com.lms.model.AdminOperationLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AdminOperationLogRepository extends JpaRepository<AdminOperationLog, Long> {
	List<AdminOperationLog> findTop50ByOrderByCreatedAtDesc();
}
