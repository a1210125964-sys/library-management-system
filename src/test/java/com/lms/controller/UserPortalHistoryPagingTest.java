package com.lms.controller;

import com.lms.exception.BusinessException;
import com.lms.model.BorrowRecord;
import com.lms.model.BorrowStatus;
import com.lms.model.Book;
import com.lms.model.User;
import com.lms.model.UserRole;
import com.lms.service.AuthService;
import com.lms.service.BorrowService;
import com.lms.service.NoticeService;
import com.lms.service.UserService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = UserPortalController.class)
@AutoConfigureMockMvc(addFilters = false)
class UserPortalHistoryPagingTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthService authService;

    @MockBean
    private BorrowService borrowService;

    @MockBean
    private NoticeService noticeService;

    @MockBean
    private UserService userService;

    @Test
    void history_should_support_pagination() throws Exception {
        User user = buildUser();
        BorrowRecord record = buildRecord(12L, BorrowStatus.RETURNED);

        Mockito.when(authService.requireUser("token")).thenReturn(user);
        Mockito.when(borrowService.myHistoryPaged(user, 0, 10))
            .thenReturn(new PageImpl<>(List.of(record), PageRequest.of(0, 10), 1));

        mockMvc.perform(get("/api/user/history")
                .header("X-Token", "token")
                .queryParam("page", "0")
                .queryParam("size", "10"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value("SUCCESS"))
            .andExpect(jsonPath("$.pagination").exists())
            .andExpect(jsonPath("$.pagination.page").value(0))
            .andExpect(jsonPath("$.pagination.size").value(10));
    }

    @Test
    void history_should_return_business_error_when_page_is_negative() throws Exception {
        User user = buildUser();

        Mockito.when(authService.requireUser("token")).thenReturn(user);
        Mockito.when(borrowService.myHistoryPaged(user, -1, 10))
            .thenThrow(new BusinessException("分页参数 page 不能小于 0"));

        mockMvc.perform(get("/api/user/history")
                .header("X-Token", "token")
                .queryParam("page", "-1")
                .queryParam("size", "10"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("BUSINESS_ERROR"));
    }

    private User buildUser() {
        User user = new User();
        user.setId(1L);
        user.setUsername("alice");
        user.setRole(UserRole.USER);
        return user;
    }

    private BorrowRecord buildRecord(Long id, BorrowStatus status) {
        Book book = new Book();
        book.setId(1L);
        book.setTitle("Java");

        BorrowRecord record = new BorrowRecord();
        record.setId(id);
        record.setUser(buildUser());
        record.setBook(book);
        record.setBorrowTime(LocalDateTime.now());
        record.setDueTime(LocalDateTime.now().plusDays(7));
        record.setStatus(status);
        record.setRenewCount(0);
        record.setOverdueFee(BigDecimal.ZERO);
        if (status == BorrowStatus.RETURNED) {
            record.setReturnTime(LocalDateTime.now());
        }
        return record;
    }
}
