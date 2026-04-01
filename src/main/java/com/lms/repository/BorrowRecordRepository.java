package com.lms.repository;

import com.lms.model.BorrowRecord;
import com.lms.model.BorrowStatus;
import com.lms.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface BorrowRecordRepository extends JpaRepository<BorrowRecord, Long> {
    List<BorrowRecord> findByUserOrderByBorrowTimeDesc(User user);
    List<BorrowRecord> findByUserAndStatusInOrderByBorrowTimeDesc(User user, Collection<BorrowStatus> statuses);
    long countByUserAndStatus(User user, BorrowStatus status);
    List<BorrowRecord> findByStatusAndDueTimeBefore(BorrowStatus status, LocalDateTime time);
}
