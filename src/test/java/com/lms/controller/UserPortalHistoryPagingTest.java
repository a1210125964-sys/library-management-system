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
import org.springframework.http.MediaType;
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

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.anyOf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
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
        Mockito.when(borrowService.myHistoryPaged(user, 0, 10, null))
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
        Mockito.when(borrowService.myHistoryPaged(user, -1, 10, null))
            .thenThrow(new BusinessException("分页参数 page 不能小于 0"));

        mockMvc.perform(get("/api/user/history")
                .header("X-Token", "token")
                .queryParam("page", "-1")
                .queryParam("size", "10"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("BUSINESS_ERROR"));
    }

    @Test
    void history_should_return_business_error_when_only_page_provided() throws Exception {
        User user = buildUser();

        Mockito.when(authService.requireUser("token")).thenReturn(user);

        mockMvc.perform(get("/api/user/history")
                .header("X-Token", "token")
                .queryParam("page", "0"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("BUSINESS_ERROR"))
            .andExpect(jsonPath("$.message").value("page 和 size 需同时提供"));
    }

    @Test
    void history_should_return_business_error_when_size_is_zero() throws Exception {
        User user = buildUser();

        Mockito.when(authService.requireUser("token")).thenReturn(user);
        Mockito.when(borrowService.myHistoryPaged(user, 0, 0, null))
            .thenThrow(new BusinessException("分页参数 size 必须大于 0"));

        mockMvc.perform(get("/api/user/history")
                .header("X-Token", "token")
                .queryParam("page", "0")
                .queryParam("size", "0"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("BUSINESS_ERROR"));
    }

    @Test
    void history_should_return_bad_request_when_page_type_is_invalid() throws Exception {
        User user = buildUser();

        Mockito.when(authService.requireUser("token")).thenReturn(user);

        mockMvc.perform(get("/api/user/history")
                .header("X-Token", "token")
                .queryParam("page", "abc")
                .queryParam("size", "10"))
            .andExpect(status().isBadRequest())
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.code", anyOf(is("BUSINESS_ERROR"), is("VALIDATION_ERROR"))));
    }

    @Test
    void history_should_return_success_without_pagination_when_page_and_size_absent() throws Exception {
        User user = buildUser();
        BorrowRecord record = buildRecord(13L, BorrowStatus.RETURNED);

        Mockito.when(authService.requireUser("token")).thenReturn(user);
        Mockito.when(borrowService.myHistory(user)).thenReturn(List.of(record));

        mockMvc.perform(get("/api/user/history")
                .header("X-Token", "token"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value("SUCCESS"))
            .andExpect(jsonPath("$.pagination").doesNotExist());
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
