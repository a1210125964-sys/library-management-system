package com.lms.controller;

import com.lms.model.BookCategory;
import com.lms.model.User;
import com.lms.service.AdminLogService;
import com.lms.service.AuthService;
import com.lms.service.BookCategoryService;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/book-categories")
public class BookCategoryController {

    private final BookCategoryService bookCategoryService;
    private final AuthService authService;
    private final AdminLogService adminLogService;

    public BookCategoryController(BookCategoryService bookCategoryService,
                                  AuthService authService,
                                  AdminLogService adminLogService) {
        this.bookCategoryService = bookCategoryService;
        this.authService = authService;
        this.adminLogService = adminLogService;
    }

    @GetMapping
    public Map<String, Object> list() {
        List<Map<String, Object>> data = bookCategoryService.list().stream().map(this::categoryMap).collect(Collectors.toList());
        return success("查询成功", data);
    }

    @PostMapping
    public Map<String, Object> create(@RequestHeader("X-Token") String token,
                                      @RequestBody Map<String, String> req) {
        User admin = authService.requireAdmin(token);
        BookCategory category = bookCategoryService.create(req.get("name"), req.get("description"));
        adminLogService.log(admin, "新增图书分类", "category=" + category.getName());
        return success("创建成功", categoryMap(category));
    }

    @PutMapping("/{id}")
    public Map<String, Object> update(@RequestHeader("X-Token") String token,
                                      @PathVariable Long id,
                                      @RequestBody Map<String, String> req) {
        User admin = authService.requireAdmin(token);
        BookCategory category = bookCategoryService.update(id, req.get("name"), req.get("description"));
        adminLogService.log(admin, "更新图书分类", "categoryId=" + id);
        return success("更新成功", categoryMap(category));
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> delete(@RequestHeader("X-Token") String token, @PathVariable Long id) {
        User admin = authService.requireAdmin(token);
        bookCategoryService.delete(id);
        adminLogService.log(admin, "删除图书分类", "categoryId=" + id);
        return success("删除成功", null);
    }

    private Map<String, Object> success(String message, Object data) {
        Map<String, Object> result = new HashMap<>();
        result.put("message", message);
        result.put("data", data);
        return result;
    }

    private Map<String, Object> categoryMap(BookCategory category) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", category.getId());
        map.put("name", category.getName());
        map.put("description", category.getDescription());
        return map;
    }
}
