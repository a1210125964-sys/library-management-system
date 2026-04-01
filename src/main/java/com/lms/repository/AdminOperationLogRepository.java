package com.lms.repository;

import com.lms.model.AdminOperationLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminOperationLogRepository extends JpaRepository<AdminOperationLog, Long> {
}
