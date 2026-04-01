package com.lms.service;

import com.lms.model.AdminOperationLog;
import com.lms.model.User;
import com.lms.repository.AdminOperationLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
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

    public Page<AdminOperationLog> recentLogs(int page, int size) {
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(size, 100));
        Pageable pageable = PageRequest.of(safePage, safeSize);
        return adminOperationLogRepository.findAllByOrderByCreatedAtDesc(pageable);
    }
}
