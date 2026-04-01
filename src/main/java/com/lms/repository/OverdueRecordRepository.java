package com.lms.repository;

import com.lms.model.OverdueRecord;
import com.lms.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface OverdueRecordRepository extends JpaRepository<OverdueRecord, Long> {
    List<OverdueRecord> findByUserOrderByCreatedAtDesc(User user);

    @Query("select orr from OverdueRecord orr join fetch orr.book join fetch orr.borrowRecord where orr.user = :user order by orr.createdAt desc")
    List<OverdueRecord> findByUserWithDetails(@Param("user") User user);
}
