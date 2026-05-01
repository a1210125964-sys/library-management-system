package com.lms.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OverdueSchedulerTest {

    @Mock
    private BorrowService borrowService;

    @InjectMocks
    private OverdueScheduler overdueScheduler;

    @Test
    void scanOverdue_should_call_borrow_service_once() {
        when(borrowService.markOverdueRecords()).thenReturn(3);

        overdueScheduler.scanOverdue();

        verify(borrowService, times(1)).markOverdueRecords();
    }
}
