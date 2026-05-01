package com.lms.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lms.model.BorrowRecord;
import com.lms.model.BorrowStatus;
import com.lms.model.Book;
import com.lms.model.OverdueRecord;
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
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = UserPortalController.class)
@AutoConfigureMockMvc(addFilters = false)
class UserPortalControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @MockBean
    private BorrowService borrowService;

    @MockBean
    private NoticeService noticeService;

    @MockBean
    private UserService userService;

    @Test
    void dashboard_should_return_summary_fields() throws Exception {
        User user = new User();
        user.setId(1L);
        user.setRole(UserRole.USER);

        Mockito.when(authService.requireUser("token")).thenReturn(user);
        Mockito.when(borrowService.countActiveByUser(1L)).thenReturn(2L);
        Mockito.when(borrowService.countOverdueByUser(1L)).thenReturn(1L);
        Mockito.when(noticeService.countPublished()).thenReturn(3L);

        mockMvc.perform(get("/api/user/dashboard").header("X-Token", "token"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value("SUCCESS"))
            .andExpect(jsonPath("$.data.activeBorrowCount").value(2))
            .andExpect(jsonPath("$.data.overdueCount").value(1))
            .andExpect(jsonPath("$.data.publishedNoticeCount").value(3));
    }

    @Test
    void borrowings_should_return_active_records() throws Exception {
        User user = buildUser();
        BorrowRecord record = buildRecord(11L, BorrowStatus.BORROWED);

        Mockito.when(authService.requireUser("token")).thenReturn(user);
        Mockito.when(borrowService.myRecords(user)).thenReturn(List.of(record));

        mockMvc.perform(get("/api/user/borrowings").header("X-Token", "token"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value("SUCCESS"))
            .andExpect(jsonPath("$.data[0].id").value(11));
    }

    @Test
    void history_should_return_returned_records() throws Exception {
        User user = buildUser();
        BorrowRecord record = buildRecord(12L, BorrowStatus.RETURNED);

        Mockito.when(authService.requireUser("token")).thenReturn(user);
        Mockito.when(borrowService.myHistory(user)).thenReturn(List.of(record));

        mockMvc.perform(get("/api/user/history").header("X-Token", "token"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value("SUCCESS"))
            .andExpect(jsonPath("$.data[0].status").value("RETURNED"));
    }

    @Test
    void fines_should_return_total_and_records() throws Exception {
        User user = buildUser();
        OverdueRecord overdue = new OverdueRecord();
        overdue.setId(21L);
        overdue.setUser(user);
        overdue.setBook(buildBook(2L));
        BorrowRecord borrowRecord = buildRecord(31L, BorrowStatus.OVERDUE);
        overdue.setBorrowRecord(borrowRecord);
        overdue.setOverdueDays(3);
        overdue.setOverdueFee(new BigDecimal("1.50"));
        overdue.setCreatedAt(LocalDateTime.now());

        Mockito.when(authService.requireUser("token")).thenReturn(user);
        Mockito.when(borrowService.myOverdueRecords(user)).thenReturn(List.of(overdue));

        mockMvc.perform(get("/api/user/fines").header("X-Token", "token"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value("SUCCESS"))
            .andExpect(jsonPath("$.data.totalFine").value(1.5))
            .andExpect(jsonPath("$.data.records[0].id").value(21));
    }

    @Test
    void profile_should_support_get_and_update() throws Exception {
        User user = buildUser();
        User updated = buildUser();
        updated.setRealName("新姓名");

        Mockito.when(authService.requireUser("token")).thenReturn(user);
        Mockito.when(userService.updateProfile(Mockito.eq(user), Mockito.any())).thenReturn(updated);

        mockMvc.perform(get("/api/user/profile").header("X-Token", "token"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.username").value("alice"));

        mockMvc.perform(put("/api/user/profile")
                .header("X-Token", "token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "realName", "新姓名",
                    "phone", "13800000000",
                    "idCard", "110101199001010011"
                ))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value("SUCCESS"))
            .andExpect(jsonPath("$.data.realName").value("新姓名"));
    }

    private User buildUser() {
        User user = new User();
        user.setId(1L);
        user.setUsername("alice");
        user.setRealName("Alice");
        user.setRole(UserRole.USER);
        return user;
    }

    private Book buildBook(Long id) {
        Book book = new Book();
        book.setId(id);
        book.setTitle("Java");
        return book;
    }

    private BorrowRecord buildRecord(Long id, BorrowStatus status) {
        BorrowRecord record = new BorrowRecord();
        record.setId(id);
        record.setUser(buildUser());
        record.setBook(buildBook(1L));
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
