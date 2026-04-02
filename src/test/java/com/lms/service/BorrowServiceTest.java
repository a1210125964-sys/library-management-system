package com.lms.service;

import com.lms.model.Book;
import com.lms.model.BorrowRecord;
import com.lms.model.BorrowStatus;
import com.lms.model.User;
import com.lms.repository.BorrowRecordRepository;
import com.lms.repository.OverdueRecordRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BorrowServiceTest {

    @Mock
    private BorrowRecordRepository borrowRecordRepository;

    @Mock
    private OverdueRecordRepository overdueRecordRepository;

    @Mock
    private BookService bookService;

    @Mock
    private SystemConfigService systemConfigService;

    @InjectMocks
    private BorrowService borrowService;

    private User user;
    private Book book;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);

        book = new Book();
        book.setId(2L);
        book.setStock(10);
        book.setAvailableStock(8);
    }

    @Test
    void returnBook_should_increase_stock_and_mark_returned() {
        BorrowRecord record = new BorrowRecord();
        record.setId(100L);
        record.setUser(user);
        record.setBook(book);
        record.setStatus(BorrowStatus.BORROWED);
        record.setDueTime(LocalDateTime.now().plusDays(1));

        when(borrowRecordRepository.findById(100L)).thenReturn(Optional.of(record));
        when(systemConfigService.overdueDailyFee()).thenReturn(1.0);
        when(borrowRecordRepository.save(any(BorrowRecord.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BorrowRecord returned = borrowService.returnBook(user, 100L);

        verify(bookService, times(1)).increaseAvailableStock(2L);
        assertEquals(BorrowStatus.RETURNED, returned.getStatus());
        assertEquals(BigDecimal.ZERO.setScale(2), returned.getOverdueFee().setScale(2));
    }
}
