package com.lms.service;

import com.lms.exception.BusinessException;
import com.lms.model.Book;
import com.lms.model.BorrowRecord;
import com.lms.model.BorrowStatus;
import com.lms.model.User;
import com.lms.repository.BorrowRecordRepository;
import com.lms.repository.OverdueRecordRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BorrowServiceConcurrencyTest {

    @Mock
    private BorrowRecordRepository borrowRecordRepository;

    @Mock
    private OverdueRecordRepository overdueRecordRepository;

    @Mock
    private BookService bookService;

    @Mock
    private SystemConfigService systemConfigService;

    private BorrowService borrowService;

    @BeforeEach
    void setUp() {
        borrowService = new BorrowService(
            borrowRecordRepository,
            overdueRecordRepository,
            bookService,
            systemConfigService
        );
    }

    @Test
    void borrow_should_fail_when_atomic_stock_decrease_returns_zero() {
        User user = buildUser(1L);
        Book book = buildBook(10L, 2, 1);

        when(systemConfigService.maxBorrowCount()).thenReturn(5);
        when(borrowRecordRepository.countByUserAndStatus(user, BorrowStatus.BORROWED)).thenReturn(0L);
        when(borrowRecordRepository.countByUserAndStatus(user, BorrowStatus.OVERDUE)).thenReturn(0L);
        when(bookService.findById(10L)).thenReturn(book);
        org.mockito.Mockito.doThrow(new BusinessException("库存不足，无法借阅"))
            .when(bookService).decreaseAvailableStockOrThrow(10L);

        BusinessException ex = assertThrows(BusinessException.class, () -> borrowService.borrow(user, 10L));

        assertEquals("库存不足，无法借阅", ex.getMessage());
    }

    @Test
    void borrow_should_create_record_when_atomic_stock_decrease_success() {
        User user = buildUser(1L);
        Book book = buildBook(10L, 2, 1);

        when(systemConfigService.maxBorrowCount()).thenReturn(5);
        when(systemConfigService.borrowDays()).thenReturn(30);
        when(borrowRecordRepository.countByUserAndStatus(user, BorrowStatus.BORROWED)).thenReturn(0L);
        when(borrowRecordRepository.countByUserAndStatus(user, BorrowStatus.OVERDUE)).thenReturn(0L);
        when(bookService.findById(10L)).thenReturn(book);
        org.mockito.Mockito.doNothing().when(bookService).decreaseAvailableStockOrThrow(10L);
        when(borrowRecordRepository.save(any(BorrowRecord.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BorrowRecord saved = borrowService.borrow(user, 10L);

        verify(bookService).decreaseAvailableStockOrThrow(10L);
        ArgumentCaptor<BorrowRecord> captor = ArgumentCaptor.forClass(BorrowRecord.class);
        verify(borrowRecordRepository).save(captor.capture());
        assertEquals(BorrowStatus.BORROWED, captor.getValue().getStatus());
        assertEquals(BorrowStatus.BORROWED, saved.getStatus());
    }

    private User buildUser(Long id) {
        User user = new User();
        user.setId(id);
        return user;
    }

    private Book buildBook(Long id, int stock, int availableStock) {
        Book book = new Book();
        book.setId(id);
        book.setStock(stock);
        book.setAvailableStock(availableStock);
        book.setCreatedAt(LocalDateTime.now());
        book.setUpdatedAt(LocalDateTime.now());
        return book;
    }
}
