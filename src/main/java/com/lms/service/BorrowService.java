package com.lms.service;

import com.lms.exception.BusinessException;
import com.lms.model.*;
import com.lms.repository.BorrowRecordRepository;
import com.lms.repository.OverdueRecordRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class BorrowService {

    private final BorrowRecordRepository borrowRecordRepository;
    private final OverdueRecordRepository overdueRecordRepository;
    private final BookService bookService;
    private final SystemConfigService systemConfigService;

    public BorrowService(BorrowRecordRepository borrowRecordRepository,
                         OverdueRecordRepository overdueRecordRepository,
                         BookService bookService,
                         SystemConfigService systemConfigService) {
        this.borrowRecordRepository = borrowRecordRepository;
        this.overdueRecordRepository = overdueRecordRepository;
        this.bookService = bookService;
        this.systemConfigService = systemConfigService;
    }

    @Transactional
    public BorrowRecord borrow(User user, Long bookId) {
        long currentBorrowed = borrowRecordRepository.countByUserAndStatus(user, BorrowStatus.BORROWED)
            + borrowRecordRepository.countByUserAndStatus(user, BorrowStatus.OVERDUE);
        if (currentBorrowed >= systemConfigService.maxBorrowCount()) {
            throw new BusinessException("已达到最大借阅数量限制");
        }

        Book book = bookService.findById(bookId);
        if (book.getAvailableStock() <= 0) {
            throw new BusinessException("库存不足，无法借阅");
        }
        bookService.decreaseAvailableStockOrThrow(bookId);

        BorrowRecord record = new BorrowRecord();
        record.setUser(user);
        record.setBook(book);
        record.setBorrowTime(LocalDateTime.now());
        record.setDueTime(LocalDateTime.now().plusDays(systemConfigService.borrowDays()));
        record.setStatus(BorrowStatus.BORROWED);
        record.setRenewCount(0);
        record.setOverdueFee(BigDecimal.ZERO);

        return borrowRecordRepository.save(record);
    }

    @Transactional
    public BorrowRecord returnBook(User user, Long recordId) {
        BorrowRecord record = findOwnedRecord(user, recordId);
        if (record.getStatus() == BorrowStatus.RETURNED) {
            throw new BusinessException("该借阅记录已归还");
        }

        record.setReturnTime(LocalDateTime.now());
        long overdueDays = Math.max(0, ChronoUnit.DAYS.between(record.getDueTime(), record.getReturnTime()));
        BigDecimal fee = feeForDays((int) overdueDays);
        record.setOverdueFee(fee);
        record.setStatus(BorrowStatus.RETURNED);

        Book book = record.getBook();
        bookService.increaseAvailableStock(book.getId());

        if (overdueDays > 0) {
            OverdueRecord overdue = new OverdueRecord();
            overdue.setUser(record.getUser());
            overdue.setBook(record.getBook());
            overdue.setBorrowRecord(record);
            overdue.setOverdueDays((int) overdueDays);
            overdue.setOverdueFee(fee);
            overdue.setCreatedAt(LocalDateTime.now());
            overdueRecordRepository.save(overdue);
        }

        return borrowRecordRepository.save(record);
    }

    @Transactional
    public BorrowRecord renew(User user, Long recordId) {
        BorrowRecord record = findOwnedRecord(user, recordId);
        if (record.getStatus() == BorrowStatus.RETURNED) {
            throw new BusinessException("已归还记录不可续借");
        }
        if (LocalDateTime.now().isAfter(record.getDueTime())) {
            throw new BusinessException("已逾期记录不可续借，请先归还");
        }
        if (record.getRenewCount() >= 1) {
            throw new BusinessException("每本图书仅允许续借 1 次");
        }

        record.setDueTime(record.getDueTime().plusDays(systemConfigService.borrowDays()));
        record.setRenewCount(record.getRenewCount() + 1);
        return borrowRecordRepository.save(record);
    }

    @Transactional
    public int markOverdueRecords() {
        return borrowRecordRepository.markOverdue(BorrowStatus.BORROWED, BorrowStatus.OVERDUE, LocalDateTime.now());
    }

    public List<BorrowRecord> myRecords(User user) {
        return borrowRecordRepository.findByUserAndStatusesWithBook(
            user,
            List.of(BorrowStatus.BORROWED, BorrowStatus.OVERDUE)
        );
    }

    public List<OverdueRecord> myOverdueRecords(User user) {
        return overdueRecordRepository.findByUserWithDetails(user);
    }

    public long countActiveByUser(Long userId) {
        return borrowRecordRepository.countByUserIdAndStatusIn(userId, List.of(BorrowStatus.BORROWED, BorrowStatus.OVERDUE));
    }

    public long countOverdueByUser(Long userId) {
        return borrowRecordRepository.countByUserIdAndStatus(userId, BorrowStatus.OVERDUE);
    }

    private BorrowRecord findOwnedRecord(User user, Long recordId) {
        BorrowRecord record = borrowRecordRepository.findById(recordId)
            .orElseThrow(() -> new BusinessException("借阅记录不存在"));
        if (!record.getUser().getId().equals(user.getId())) {
            throw new BusinessException("无权操作此借阅记录");
        }
        return record;
    }

    private BigDecimal feeForDays(int days) {
        return BigDecimal.valueOf(days)
            .multiply(BigDecimal.valueOf(systemConfigService.overdueDailyFee()))
            .setScale(2, RoundingMode.HALF_UP);
    }
}
