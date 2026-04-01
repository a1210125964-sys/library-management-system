package com.lms.controller;

import com.lms.dto.BookRequest;
import com.lms.model.Book;
import com.lms.model.User;
import com.lms.service.AdminLogService;
import com.lms.service.AuthService;
import com.lms.service.BookService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/books")
public class BookController {

    private final BookService bookService;
    private final AuthService authService;
    private final AdminLogService adminLogService;

    public BookController(BookService bookService, AuthService authService, AdminLogService adminLogService) {
        this.bookService = bookService;
        this.authService = authService;
        this.adminLogService = adminLogService;
    }

    @GetMapping
    public Map<String, Object> list(@RequestParam(required = false) String keyword) {
        List<Map<String, Object>> data = bookService.list(keyword).stream().map(this::bookMap).collect(Collectors.toList());
        return success("查询成功", data);
    }

    @PostMapping
    public Map<String, Object> create(@RequestHeader("X-Token") String token, @Valid @RequestBody BookRequest req) {
        User admin = authService.requireAdmin(token);
        Book book = bookService.create(req);
        adminLogService.log(admin, "新增图书", "bookId=" + book.getId());
        return success("创建成功", bookMap(book));
    }

    @PutMapping("/{id}")
    public Map<String, Object> update(@RequestHeader("X-Token") String token,
                                      @PathVariable Long id,
                                      @Valid @RequestBody BookRequest req) {
        User admin = authService.requireAdmin(token);
        Book book = bookService.update(id, req);
        adminLogService.log(admin, "更新图书", "bookId=" + id);
        return success("更新成功", bookMap(book));
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> delete(@RequestHeader("X-Token") String token, @PathVariable Long id) {
        User admin = authService.requireAdmin(token);
        bookService.delete(id);
        adminLogService.log(admin, "删除图书", "bookId=" + id);
        return success("删除成功", null);
    }

    private Map<String, Object> success(String message, Object data) {
        Map<String, Object> result = new HashMap<>();
        result.put("message", message);
        result.put("data", data);
        return result;
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
