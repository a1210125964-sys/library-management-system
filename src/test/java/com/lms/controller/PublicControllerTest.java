package com.lms.controller;

import com.lms.config.SecurityConfig;
import com.lms.config.TokenAuthenticationFilter;
import com.lms.model.Book;
import com.lms.model.Notice;
import com.lms.service.AuthService;
import com.lms.service.BookService;
import com.lms.service.NoticeService;
import com.lms.service.StatisticsService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = PublicController.class)
@AutoConfigureMockMvc
@Import({SecurityConfig.class, TokenAuthenticationFilter.class})
class PublicControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthService authService;

    @MockBean
    private StatisticsService statisticsService;

    @MockBean
    private NoticeService noticeService;

    @MockBean
    private BookService bookService;

    @Test
    void public_api_should_be_accessible_without_token() throws Exception {
        Mockito.when(statisticsService.publicOverview()).thenReturn(Map.of("totalBooks", 0L));

        mockMvc.perform(get("/api/public/stats"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value("SUCCESS"));
    }

    @Test
    void public_notices_should_return_pagination() throws Exception {
        Notice notice = new Notice();
        notice.setId(1L);
        notice.setTitle("公告标题");
        notice.setSummary("公告摘要");
        notice.setContent("公告正文");
        notice.setPublishedAt(LocalDateTime.now());

        Mockito.when(noticeService.listPublished(0, 10))
            .thenReturn(new PageImpl<>(List.of(notice), PageRequest.of(0, 10), 1));

        mockMvc.perform(get("/api/public/notices").queryParam("page", "0").queryParam("size", "10"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value("SUCCESS"))
            .andExpect(jsonPath("$.pagination").exists());
    }

    @Test
    void public_notice_detail_should_return_success() throws Exception {
        Notice notice = new Notice();
        notice.setId(1L);
        notice.setTitle("公告标题");
        notice.setSummary("公告摘要");
        notice.setContent("公告正文");
        notice.setPublishedAt(LocalDateTime.now());

        Mockito.when(noticeService.getPublishedDetail(1L)).thenReturn(notice);

        mockMvc.perform(get("/api/public/notices/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value("SUCCESS"));
    }

    @Test
    void public_stats_should_return_success() throws Exception {
        Mockito.when(statisticsService.publicOverview()).thenReturn(Map.of(
            "totalBooks", 10L,
            "availableBooks", 8L,
            "borrowedBooks", 2L
        ));

        mockMvc.perform(get("/api/public/stats"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value("SUCCESS"));
    }

    @Test
    void public_books_should_proxy_book_query_and_return_success() throws Exception {
        Book book = new Book();
        book.setId(1L);
        book.setTitle("Java 编程思想");
        book.setAuthor("Bruce Eckel");
        book.setPublisher("机械工业出版社");
        book.setIsbn("9787111213826");
        book.setCategory("编程");
        book.setStock(10);
        book.setAvailableStock(7);

        Mockito.when(bookService.listPage("java", 0, 10))
            .thenReturn(new PageImpl<>(List.of(book), PageRequest.of(0, 10), 1));

        mockMvc.perform(get("/api/public/books")
                .queryParam("keyword", "java")
                .queryParam("page", "0")
                .queryParam("size", "10"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value("SUCCESS"));
    }
}