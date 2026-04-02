package com.lms.controller;

import com.lms.model.User;
import com.lms.model.UserRole;
import com.lms.service.AuthService;
import com.lms.service.BorrowService;
import com.lms.service.NoticeService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = UserPortalController.class)
@AutoConfigureMockMvc(addFilters = false)
class UserPortalControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthService authService;

    @MockBean
    private BorrowService borrowService;

    @MockBean
    private NoticeService noticeService;

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
            .andExpect(jsonPath("$.data.overdueCount").value(1));
    }
}
