package com.lms.service;

import com.lms.dto.NoticeRequest;
import com.lms.model.Notice;
import com.lms.model.User;
import com.lms.model.UserRole;
import com.lms.repository.NoticeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NoticeServiceTest {

    @Mock
    private NoticeRepository noticeRepository;

    @InjectMocks
    private NoticeService noticeService;

    private User adminUser;

    @BeforeEach
    void setUp() {
        adminUser = new User();
        adminUser.setId(1L);
        adminUser.setRole(UserRole.ADMIN);
    }

    @Test
    void create_should_save_notice_with_publish_time_when_published() {
        NoticeRequest req = new NoticeRequest("开馆通知", "摘要", "正文", true);
        when(noticeRepository.save(any(Notice.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Notice created = noticeService.create(req, adminUser);

        assertEquals("开馆通知", created.getTitle());
        assertEquals("摘要", created.getSummary());
        assertEquals("正文", created.getContent());
        assertEquals(Boolean.TRUE, created.getPublished());
        assertNotNull(created.getPublishedAt());
        assertNotNull(created.getCreatedAt());
        assertNotNull(created.getUpdatedAt());
    }

    @Test
    void list_published_should_return_desc_order_with_pagination() {
        Notice newer = new Notice();
        newer.setTitle("新公告");
        Notice older = new Notice();
        older.setTitle("旧公告");
        Page<Notice> pageData = new PageImpl<>(List.of(newer, older));

        when(noticeRepository.findByPublishedTrue(any(Pageable.class))).thenReturn(pageData);

        Page<Notice> result = noticeService.listPublished(0, 10);

        assertFalse(result.getContent().isEmpty());
        assertEquals("新公告", result.getContent().get(0).getTitle());

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(noticeRepository).findByPublishedTrue(pageableCaptor.capture());
        Pageable pageable = pageableCaptor.getValue();
        assertEquals(0, pageable.getPageNumber());
        assertEquals(10, pageable.getPageSize());
        assertEquals("publishedAt: DESC", pageable.getSort().toString());
    }
}
