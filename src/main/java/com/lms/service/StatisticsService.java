package com.lms.service;

import com.lms.model.BorrowStatus;
import com.lms.repository.BookRepository;
import com.lms.repository.BorrowRecordRepository;
import com.lms.repository.OverdueRecordRepository;
import com.lms.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.HashMap;
import java.util.Map;

@Service
public class StatisticsService {

    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final BorrowRecordRepository borrowRecordRepository;
    private final OverdueRecordRepository overdueRecordRepository;

    public StatisticsService(UserRepository userRepository,
                             BookRepository bookRepository,
                             BorrowRecordRepository borrowRecordRepository,
                             OverdueRecordRepository overdueRecordRepository) {
        this.userRepository = userRepository;
        this.bookRepository = bookRepository;
        this.borrowRecordRepository = borrowRecordRepository;
        this.overdueRecordRepository = overdueRecordRepository;
    }

    public Map<String, Object> overview() {
        Map<String, Object> map = new HashMap<>();
        map.put("userCount", userRepository.count());
        map.put("bookCount", bookRepository.count());
        map.put("borrowCount", borrowRecordRepository.count());
        map.put("overdueRecordCount", overdueRecordRepository.count());
        map.put("activeBorrowCount", borrowRecordRepository.countByStatusIn(List.of(BorrowStatus.BORROWED, BorrowStatus.OVERDUE)));
        return map;
    }

    public Map<String, Object> publicOverview() {
        Map<String, Object> map = new HashMap<>();
        long totalBooks = bookRepository.count();
        long activeBorrowCount = borrowRecordRepository.countByStatusIn(List.of(BorrowStatus.BORROWED, BorrowStatus.OVERDUE));
        long availableBooks = Math.max(0, totalBooks - activeBorrowCount);
        map.put("totalBooks", totalBooks);
        map.put("availableBooks", availableBooks);
        map.put("borrowedBooks", activeBorrowCount);
        return map;
    }

    public List<Map<String, Object>> bookBorrowStats(int limit) {
        List<Object[]> rows = borrowRecordRepository.topBookBorrowStats(Math.max(1, limit));
        return rows.stream().map(this::toBookStatMap).toList();
    }

    public List<Map<String, Object>> userBorrowStats(int limit) {
        List<Object[]> rows = borrowRecordRepository.topUserBorrowStats(Math.max(1, limit));
        return rows.stream().map(this::toUserStatMap).toList();
    }

    private Map<String, Object> toBookStatMap(Object[] row) {
        Map<String, Object> map = new HashMap<>();
        map.put("bookId", longVal(row[0]));
        map.put("title", stringVal(row[1]));
        map.put("author", stringVal(row[2]));
        map.put("category", stringVal(row[3]));
        map.put("borrowCount", longVal(row[4]));
        map.put("activeBorrowCount", longVal(row[5]));
        map.put("returnedCount", longVal(row[6]));
        return map;
    }

    private Map<String, Object> toUserStatMap(Object[] row) {
        Map<String, Object> map = new HashMap<>();
        map.put("userId", longVal(row[0]));
        map.put("username", stringVal(row[1]));
        map.put("realName", stringVal(row[2]));
        map.put("borrowCount", longVal(row[3]));
        map.put("activeBorrowCount", longVal(row[4]));
        map.put("overdueCount", longVal(row[5]));
        map.put("overdueFeeTotal", decimalVal(row[6]));
        return map;
    }

    private String stringVal(Object value) {
        return value == null ? "" : value.toString();
    }

    private long longVal(Object value) {
        return value == null ? 0L : ((Number) value).longValue();
    }

    private BigDecimal decimalVal(Object value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        if (value instanceof BigDecimal decimal) {
            return decimal;
        }
        if (value instanceof Number number) {
            return BigDecimal.valueOf(number.doubleValue());
        }
        return new BigDecimal(value.toString());
    }
}
