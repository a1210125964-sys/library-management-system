package com.lms.controller;

import com.lms.dto.BookRequest;
import com.lms.dto.ApiResponse;
import com.lms.model.Book;
import com.lms.model.User;
import com.lms.service.AdminLogService;
import com.lms.service.AuthService;
import com.lms.service.BookService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
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
    public ApiResponse<List<Map<String, Object>>> list(@RequestParam(required = false) String keyword,
                                                       @RequestParam(required = false) Integer page,
                                                       @RequestParam(required = false) Integer size,
                                                       @RequestParam(defaultValue = "false") boolean all) {
        if (page != null && size != null) {
            Page<Book> result = all ? bookService.listAllPage(keyword, page, size) : bookService.listPage(keyword, page, size);
            List<Map<String, Object>> data = result.getContent().stream().map(this::bookMap).collect(Collectors.toList());
            return ApiResponse.success("查询成功", data, pagination(result));
        }
        List<Map<String, Object>> data = bookService.list(keyword).stream().map(this::bookMap).collect(Collectors.toList());
        return ApiResponse.success("查询成功", data);
    }

    @PostMapping
    public ApiResponse<Map<String, Object>> create(@RequestHeader("X-Token") String token, @Valid @RequestBody BookRequest req) {
        User admin = authService.requireAdmin(token);
        Book book = bookService.create(req);
        adminLogService.log(admin, "新增图书", "bookId=" + book.getId());
        return ApiResponse.success("创建成功", bookMap(book));
    }

    @PutMapping("/{id}")
    public ApiResponse<Map<String, Object>> update(@RequestHeader("X-Token") String token,
                                                   @PathVariable Long id,
                                                   @Valid @RequestBody BookRequest req) {
        User admin = authService.requireAdmin(token);
        Book book = bookService.update(id, req);
        adminLogService.log(admin, "更新图书", "bookId=" + id);
        return ApiResponse.success("更新成功", bookMap(book));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Object> delete(@RequestHeader("X-Token") String token, @PathVariable Long id) {
        User admin = authService.requireAdmin(token);
        bookService.delete(id);
        adminLogService.log(admin, "删除图书", "bookId=" + id);
        return ApiResponse.success("删除成功", null);
    }

    @PutMapping("/{id}/shelve")
    public ApiResponse<Map<String, Object>> shelve(@RequestHeader("X-Token") String token,
                                                    @PathVariable Long id,
                                                    @RequestParam boolean active) {
        User admin = authService.requireAdmin(token);
        Book book = bookService.shelve(id, active);
        adminLogService.log(admin, active ? "上架图书" : "下架图书", "bookId=" + id);
        return ApiResponse.success(active ? "上架成功" : "下架成功", bookMap(book));
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
        map.put("active", book.getActive());
        return map;
    }
}
