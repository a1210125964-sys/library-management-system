package com.lms.service;

import com.lms.repository.BookRepository;
import com.lms.repository.BorrowRecordRepository;
import com.lms.repository.OverdueRecordRepository;
import com.lms.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StatisticsServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private BookRepository bookRepository;

    @Mock
    private BorrowRecordRepository borrowRecordRepository;

    @Mock
    private OverdueRecordRepository overdueRecordRepository;

    @InjectMocks
    private StatisticsService statisticsService;

    @Test
    void publicOverview_should_use_book_stock_aggregation_metrics() {
        when(bookRepository.sumStockAndAvailableStock()).thenReturn(new Object[]{12L, 9L});

        Map<String, Object> result = statisticsService.publicOverview();

        assertEquals(12L, result.get("totalBooks"));
        assertEquals(9L, result.get("availableBooks"));
        assertEquals(3L, result.get("borrowedBooks"));
        verifyNoInteractions(borrowRecordRepository);
    }
}
