package com.lms.repository;

import com.lms.model.AdminOperationLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

import java.util.List;

public interface AdminOperationLogRepository extends JpaRepository<AdminOperationLog, Long> {
	List<AdminOperationLog> findTop50ByOrderByCreatedAtDesc();

	Page<AdminOperationLog> findAllByOrderByCreatedAtDesc(Pageable pageable);

	@Query("""
		select l from AdminOperationLog l
		where (:operation is null or l.operation like concat('%', :operation, '%'))
		  and (:startTime is null or l.createdAt >= :startTime)
		  and (:endTime is null or l.createdAt <= :endTime)
		order by l.createdAt desc
		""")
	Page<AdminOperationLog> search(@Param("operation") String operation,
								   @Param("startTime") LocalDateTime startTime,
								   @Param("endTime") LocalDateTime endTime,
								   Pageable pageable);
}
