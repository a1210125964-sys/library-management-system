package com.lms.service;

import com.lms.model.AdminOperationLog;
import com.lms.model.User;
import com.lms.repository.AdminOperationLogRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AdminLogService {

    private final AdminOperationLogRepository adminOperationLogRepository;

    public AdminLogService(AdminOperationLogRepository adminOperationLogRepository) {
        this.adminOperationLogRepository = adminOperationLogRepository;
    }

    public void log(User admin, String operation, String detail) {
        AdminOperationLog log = new AdminOperationLog();
        log.setAdmin(admin);
        log.setOperation(operation);
        log.setDetail(detail);
        log.setCreatedAt(LocalDateTime.now());
        adminOperationLogRepository.save(log);
    }

    public List<AdminOperationLog> recentLogs() {
        return adminOperationLogRepository.findTop50ByOrderByCreatedAtDesc();
    }
}
