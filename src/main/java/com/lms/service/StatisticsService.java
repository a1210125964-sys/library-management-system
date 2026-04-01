package com.lms.service;

import com.lms.model.BorrowStatus;
import com.lms.repository.BookRepository;
import com.lms.repository.BorrowRecordRepository;
import com.lms.repository.OverdueRecordRepository;
import com.lms.repository.UserRepository;
import org.springframework.stereotype.Service;

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
        map.put("activeBorrowCount", borrowRecordRepository.findByStatusAndDueTimeBefore(BorrowStatus.BORROWED, java.time.LocalDateTime.MAX).size());
        return map;
    }
}
