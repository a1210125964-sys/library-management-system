package com.lms.controller;

import com.lms.dto.ApiResponse;
import com.lms.model.Book;
import com.lms.model.Notice;
import com.lms.service.BookService;
import com.lms.service.NoticeService;
import com.lms.service.StatisticsService;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/public")
public class PublicController {

    private final StatisticsService statisticsService;
    private final NoticeService noticeService;
    private final BookService bookService;

    public PublicController(StatisticsService statisticsService, NoticeService noticeService, BookService bookService) {
        this.statisticsService = statisticsService;
        this.noticeService = noticeService;
        this.bookService = bookService;
    }

    @GetMapping("/stats")
    public ApiResponse<Map<String, Object>> stats() {
        return ApiResponse.success("查询成功", statisticsService.publicOverview());
    }

    @GetMapping("/notices")
    public ApiResponse<List<Map<String, Object>>> notices(@RequestParam(defaultValue = "0") int page,
                                                           @RequestParam(defaultValue = "10") int size) {
        Page<Notice> result = noticeService.listPublished(page, size);
        List<Map<String, Object>> data = result.getContent().stream().map(this::noticeMap).toList();
        return ApiResponse.success("查询成功", data, pagination(result));
    }

    @GetMapping("/notices/{id}")
    public ApiResponse<Map<String, Object>> noticeDetail(@PathVariable Long id) {
        Notice notice = noticeService.getPublishedDetail(id);
        return ApiResponse.success("查询成功", noticeMap(notice));
    }

    @GetMapping("/books")
    public ApiResponse<List<Map<String, Object>>> books(@RequestParam(required = false) String keyword,
                                                         @RequestParam(defaultValue = "0") int page,
                                                         @RequestParam(defaultValue = "10") int size) {
        Page<Book> result = bookService.listPage(keyword, page, size);
        List<Map<String, Object>> data = result.getContent().stream().map(this::bookMap).toList();
        return ApiResponse.success("查询成功", data, pagination(result));
    }

    private Map<String, Object> pagination(Page<?> page) {
        Map<String, Object> map = new HashMap<>();
        map.put("page", page.getNumber());
        map.put("size", page.getSize());
        map.put("totalElements", page.getTotalElements());
        map.put("totalPages", page.getTotalPages());
        map.put("first", page.isFirst());
        map.put("last", page.isLast());
        return map;
    }

    private Map<String, Object> noticeMap(Notice notice) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", notice.getId());
        map.put("title", notice.getTitle());
        map.put("summary", notice.getSummary());
        map.put("content", notice.getContent());
        map.put("publishedAt", notice.getPublishedAt());
        return map;
    }

    private Map<String, Object> bookMap(Book book) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", book.getId());
        map.put("title", book.getTitle());
        map.put("author", book.getAuthor());
        map.put("publisher", book.getPublisher());
        map.put("isbn", book.getIsbn());
        map.put("category", book.getCategory());
        map.put("stock", book.getStock());
        map.put("availableStock", book.getAvailableStock());
        return map;
    }
}
