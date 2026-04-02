package com.lms.controller;

import com.lms.model.Book;
import com.lms.model.BorrowRecord;
import com.lms.model.BorrowStatus;
import com.lms.model.User;
import com.lms.model.UserRole;
import com.lms.service.AuthService;
import com.lms.service.BorrowService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = BorrowController.class)
@AutoConfigureMockMvc(addFilters = false)
class BorrowControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthService authService;

    @MockBean
    private BorrowService borrowService;

    @Test
    void myRecords_should_return_success_code() throws Exception {
        User user = new User();
        user.setId(1L);
        user.setRole(UserRole.USER);

        Book book = new Book();
        book.setId(2L);
        book.setTitle("Spring");

        BorrowRecord record = new BorrowRecord();
        record.setId(3L);
        record.setUser(user);
        record.setBook(book);
        record.setBorrowTime(LocalDateTime.now());
        record.setDueTime(LocalDateTime.now().plusDays(10));
        record.setStatus(BorrowStatus.BORROWED);
        record.setRenewCount(0);
        record.setOverdueFee(BigDecimal.ZERO);

        Mockito.when(authService.requireUser("token")).thenReturn(user);
        Mockito.when(borrowService.myRecords(user)).thenReturn(List.of(record));

        mockMvc.perform(get("/api/borrow/my")
                .header("X-Token", "token")
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("查询成功"))
            .andExpect(jsonPath("$.data[0].bookTitle").value("Spring"));
    }
}
