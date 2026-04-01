package com.lms.repository;

import com.lms.model.OverdueRecord;
import com.lms.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OverdueRecordRepository extends JpaRepository<OverdueRecord, Long> {
    List<OverdueRecord> findByUserOrderByCreatedAtDesc(User user);
}
