package com.lms.controller;

import com.lms.model.Notice;
import com.lms.model.User;
import com.lms.model.UserRole;
import com.lms.service.AdminLogService;
import com.lms.service.AuthService;
import com.lms.service.NoticeService;
import com.lms.service.StatisticsService;
import com.lms.service.SystemConfigService;
import com.lms.service.UserService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentMatchers;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AdminController.class)
@AutoConfigureMockMvc(addFilters = false)
class AdminNoticeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthService authService;

    @MockBean
    private StatisticsService statisticsService;

    @MockBean
    private SystemConfigService systemConfigService;

    @MockBean
    private AdminLogService adminLogService;

    @MockBean
    private UserService userService;

    @MockBean
    private NoticeService noticeService;

    @Test
    void admin_should_create_notice() throws Exception {
        User admin = new User();
        admin.setId(1L);
        admin.setRole(UserRole.ADMIN);

        Notice created = new Notice();
        created.setId(100L);
        created.setTitle("系统维护");
        created.setSummary("摘要");
        created.setContent("正文");
        created.setPublished(true);
        created.setPublishedAt(LocalDateTime.now());

        Mockito.when(authService.requireAdmin("admin-token")).thenReturn(admin);
        Mockito.when(noticeService.create(ArgumentMatchers.any(), ArgumentMatchers.eq(admin))).thenReturn(created);

        mockMvc.perform(post("/api/admin/notices")
                .header("X-Token", "admin-token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"系统维护\",\"summary\":\"摘要\",\"content\":\"正文\",\"published\":true}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value("SUCCESS"));
    }

    @Test
    void admin_should_update_notice() throws Exception {
        User admin = new User();
        admin.setId(1L);
        admin.setRole(UserRole.ADMIN);

        Notice updated = new Notice();
        updated.setId(100L);
        updated.setTitle("系统维护(更新)");
        updated.setSummary("新摘要");
        updated.setContent("新正文");
        updated.setPublished(false);

        Mockito.when(authService.requireAdmin("admin-token")).thenReturn(admin);
        Mockito.when(noticeService.update(ArgumentMatchers.eq(100L), ArgumentMatchers.any(), ArgumentMatchers.eq(admin))).thenReturn(updated);

        mockMvc.perform(put("/api/admin/notices/100")
                .header("X-Token", "admin-token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"系统维护(更新)\",\"summary\":\"新摘要\",\"content\":\"新正文\",\"published\":false}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value("SUCCESS"))
            .andExpect(jsonPath("$.data.id").value(100))
            .andExpect(jsonPath("$.data.title").value("系统维护(更新)"));
    }

    @Test
    void admin_should_delete_notice() throws Exception {
        User admin = new User();
        admin.setId(1L);
        admin.setRole(UserRole.ADMIN);

        Mockito.when(authService.requireAdmin("admin-token")).thenReturn(admin);
        Mockito.doNothing().when(noticeService).delete(100L, admin);

        mockMvc.perform(delete("/api/admin/notices/100")
                .header("X-Token", "admin-token"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value("SUCCESS"));
    }

    @Test
    void admin_should_list_notices_with_pagination() throws Exception {
        User admin = new User();
        admin.setId(1L);
        admin.setRole(UserRole.ADMIN);

        Notice notice = new Notice();
        notice.setId(100L);
        notice.setTitle("系统维护");
        notice.setSummary("摘要");
        notice.setContent("正文");
        notice.setPublished(true);
        notice.setPublishedAt(LocalDateTime.now());

        Mockito.when(authService.requireAdmin("admin-token")).thenReturn(admin);
        Mockito.when(noticeService.listAll(0, 10))
            .thenReturn(new org.springframework.data.domain.PageImpl<>(
                List.of(notice),
                org.springframework.data.domain.PageRequest.of(0, 10),
                1
            ));

        mockMvc.perform(get("/api/admin/notices")
                .header("X-Token", "admin-token")
                .queryParam("page", "0")
                .queryParam("size", "10"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value("SUCCESS"))
            .andExpect(jsonPath("$.pagination").exists())
            .andExpect(jsonPath("$.data[0].id").value(100));
    }
}
