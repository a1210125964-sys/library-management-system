package com.lms.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class OverdueScheduler {

    private static final Logger log = LoggerFactory.getLogger(OverdueScheduler.class);

    private final BorrowService borrowService;

    public OverdueScheduler(BorrowService borrowService) {
        this.borrowService = borrowService;
    }

    @Scheduled(cron = "${app.borrow.overdue-scan-cron:0 0 3 * * ?}")
    public void scanOverdue() {
        int updated = borrowService.markOverdueRecords();
        log.info("Overdue scan finished, updatedCount={}", updated);
    }
}
