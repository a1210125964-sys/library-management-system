package com.lms.repository;

import com.lms.model.BorrowRecord;
import com.lms.model.BorrowStatus;
import com.lms.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface BorrowRecordRepository extends JpaRepository<BorrowRecord, Long> {
    List<BorrowRecord> findByUserOrderByBorrowTimeDesc(User user);
    List<BorrowRecord> findByUserAndStatusInOrderByBorrowTimeDesc(User user, Collection<BorrowStatus> statuses);
    @EntityGraph(attributePaths = "book")
    Page<BorrowRecord> findByUserAndStatusInOrderByBorrowTimeDesc(User user,
                                                                   Collection<BorrowStatus> statuses,
                                                                   Pageable pageable);
    long countByUserAndStatus(User user, BorrowStatus status);
    long countByUserIdAndStatusIn(Long userId, Collection<BorrowStatus> statuses);
    long countByUserIdAndStatus(Long userId, BorrowStatus status);
    long countByStatusIn(Collection<BorrowStatus> statuses);
    long countByStatus(BorrowStatus status);

    @EntityGraph(attributePaths = "book")
    @Query("select br from BorrowRecord br where br.user = :user and br.status = 'RETURNED' and br.overdueFee > 0 order by br.borrowTime desc")
    Page<BorrowRecord> findOverdueHistoryByUser(@Param("user") User user, Pageable pageable);
    List<BorrowRecord> findByStatusAndDueTimeBefore(BorrowStatus status, LocalDateTime time);

    @Query("select br from BorrowRecord br join fetch br.book where br.user = :user and br.status in :statuses order by br.borrowTime desc")
    List<BorrowRecord> findByUserAndStatusesWithBook(@Param("user") User user,
                                                     @Param("statuses") Collection<BorrowStatus> statuses);

    @EntityGraph(attributePaths = {"user", "book"})
    @Query("""
        select br from BorrowRecord br
        join br.user u
        join br.book b
        where (:status is null or br.status = :status)
          and (:keyword is null
               or trim(:keyword) = ''
               or lower(u.username) like lower(concat('%', :keyword, '%'))
               or lower(u.realName) like lower(concat('%', :keyword, '%'))
               or lower(b.title) like lower(concat('%', :keyword, '%')))
        order by br.borrowTime desc
        """)
    Page<BorrowRecord> searchForAdmin(@Param("status") BorrowStatus status,
                                      @Param("keyword") String keyword,
                                      Pageable pageable);

    @Modifying
    @Query("update BorrowRecord br set br.status = :toStatus where br.status = :fromStatus and br.dueTime < :now")
    int markOverdue(@Param("fromStatus") BorrowStatus fromStatus,
                    @Param("toStatus") BorrowStatus toStatus,
                    @Param("now") LocalDateTime now);

    @Query(value = """
        select b.id as book_id,
               b.title as title,
               b.author as author,
               b.category as category,
               count(br.id) as borrow_count,
               sum(case when br.status in ('BORROWED', 'OVERDUE') then 1 else 0 end) as active_borrow_count,
               sum(case when br.status = 'RETURNED' then 1 else 0 end) as returned_count
        from borrow_records br
        join books b on b.id = br.book_id
        group by b.id, b.title, b.author, b.category
        order by borrow_count desc, b.id asc
        limit :limitCount
        """, nativeQuery = true)
    List<Object[]> topBookBorrowStats(@Param("limitCount") int limitCount);

    @Query(value = """
        select u.id as user_id,
               u.username as username,
               u.real_name as real_name,
               coalesce(brs.borrow_count, 0) as borrow_count,
               coalesce(brs.active_borrow_count, 0) as active_borrow_count,
               coalesce(ors.overdue_count, 0) as overdue_count,
               coalesce(ors.overdue_fee_total, 0) as overdue_fee_total
        from users u
        left join (
            select user_id,
                   count(*) as borrow_count,
                   sum(case when status in ('BORROWED', 'OVERDUE') then 1 else 0 end) as active_borrow_count
            from borrow_records
            group by user_id
        ) brs on brs.user_id = u.id
        left join (
            select user_id,
                   count(*) as overdue_count,
                   sum(overdue_fee) as overdue_fee_total
            from overdue_records
            group by user_id
        ) ors on ors.user_id = u.id
        where u.role = 'USER'
        order by borrow_count desc, overdue_count desc, u.id asc
        limit :limitCount
        """, nativeQuery = true)
    List<Object[]> topUserBorrowStats(@Param("limitCount") int limitCount);
}
