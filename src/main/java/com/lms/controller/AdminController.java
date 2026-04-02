package com.lms.controller;

import com.lms.dto.ApiResponse;
import com.lms.dto.ConfigUpdateRequest;
import com.lms.dto.NoticeRequest;
import com.lms.dto.ResetPasswordRequest;
import com.lms.model.AdminOperationLog;
import com.lms.model.Notice;
import com.lms.model.User;
import com.lms.model.UserRole;
import com.lms.service.AdminLogService;
import com.lms.service.AuthService;
import com.lms.service.NoticeService;
import com.lms.service.StatisticsService;
import com.lms.service.SystemConfigService;
import com.lms.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AuthService authService;
    private final StatisticsService statisticsService;
    private final SystemConfigService systemConfigService;
    private final AdminLogService adminLogService;
    private final UserService userService;
    private final NoticeService noticeService;

    public AdminController(AuthService authService,
                           StatisticsService statisticsService,
                           SystemConfigService systemConfigService,
                           AdminLogService adminLogService,
                           UserService userService,
                           NoticeService noticeService) {
        this.authService = authService;
        this.statisticsService = statisticsService;
        this.systemConfigService = systemConfigService;
        this.adminLogService = adminLogService;
        this.userService = userService;
        this.noticeService = noticeService;
    }

    @GetMapping("/stats")
    public Map<String, Object> stats(@RequestHeader("X-Token") String token) {
        authService.requireAdmin(token);
        return success("查询成功", statisticsService.overview());
    }

    @GetMapping("/stats/books")
    public Map<String, Object> bookStats(@RequestHeader("X-Token") String token,
                                         @RequestParam(defaultValue = "10") Integer limit) {
        authService.requireAdmin(token);
        return success("查询成功", statisticsService.bookBorrowStats(limit));
    }

    @GetMapping("/stats/users")
    public Map<String, Object> userStats(@RequestHeader("X-Token") String token,
                                         @RequestParam(defaultValue = "20") Integer limit) {
        authService.requireAdmin(token);
        return success("查询成功", statisticsService.userBorrowStats(limit));
    }

    @GetMapping("/configs")
    public Map<String, Object> configs(@RequestHeader("X-Token") String token) {
        authService.requireAdmin(token);
        return success("查询成功", systemConfigService.getAllAsMap());
    }

    @PutMapping("/configs")
    public Map<String, Object> updateConfigs(@RequestHeader("X-Token") String token,
                                             @Valid @RequestBody ConfigUpdateRequest req,
                                             HttpServletRequest request) {
        long start = System.currentTimeMillis();
        User admin = authService.requireAdmin(token);
        Map<String, String> configs = systemConfigService.update(req);
        adminLogService.log(admin,
            "更新系统参数",
            configs.toString(),
            "SUCCESS",
            System.currentTimeMillis() - start,
            resolveClientIp(request),
            request.getHeader("User-Agent"));
        return success("更新成功", configs);
    }

    @GetMapping("/users")
    public Map<String, Object> users(@RequestHeader("X-Token") String token,
                                     @RequestParam(required = false) String role,
                                     @RequestParam(required = false) Integer page,
                                     @RequestParam(required = false) Integer size) {
        authService.requireAdmin(token);
        UserRole roleFilter = parseRole(role);

        if (page != null && size != null) {
            Page<User> result = userService.listUsersPaged(roleFilter, page, size);
            List<Map<String, Object>> users = result.getContent().stream().map(this::userMap).collect(Collectors.toList());
            return success("查询成功", users, pagination(result));
        }

        List<Map<String, Object>> users = userService.listAllUsers(roleFilter).stream().map(this::userMap).collect(Collectors.toList());
        return success("查询成功", users);
    }

    @PostMapping("/users/{id}/reset-password")
    public Map<String, Object> resetPassword(@RequestHeader("X-Token") String token,
                                             @PathVariable Long id,
                                             @Valid @RequestBody ResetPasswordRequest req,
                                             HttpServletRequest request) {
        long start = System.currentTimeMillis();
        User admin = authService.requireAdmin(token);
        User user = userService.resetPassword(id, req.getNewPassword());
        adminLogService.log(admin,
            "重置用户密码",
            "userId=" + id,
            "SUCCESS",
            System.currentTimeMillis() - start,
            resolveClientIp(request),
            request.getHeader("User-Agent"));
        return success("密码重置成功", userMap(user));
    }

    @GetMapping("/logs")
    public Map<String, Object> logs(@RequestHeader("X-Token") String token,
                                    @RequestParam(required = false) String operation,
                                    @RequestParam(required = false) String startTime,
                                    @RequestParam(required = false) String endTime,
                                    @RequestParam(required = false) Integer page,
                                    @RequestParam(required = false) Integer size) {
        authService.requireAdmin(token);
        LocalDateTime start = parseDateTime(startTime);
        LocalDateTime end = parseDateTime(endTime);

        if (page != null && size != null) {
            Page<AdminOperationLog> result = adminLogService.searchLogs(operation, start, end, page, size);
            List<Map<String, Object>> data = result.getContent().stream().map(this::logMap).collect(Collectors.toList());
            return success("查询成功", data, pagination(result));
        }

        Page<AdminOperationLog> result = adminLogService.searchLogs(operation, start, end, 0, 50);
        List<Map<String, Object>> data = result.getContent().stream().map(this::logMap).collect(Collectors.toList());
        return success("查询成功", data);
    }

    @PostMapping("/notices")
    public ApiResponse<Map<String, Object>> createNotice(@RequestHeader("X-Token") String token,
                                                          @Valid @RequestBody NoticeRequest req) {
        User admin = authService.requireAdmin(token);
        Notice notice = noticeService.create(req, admin);
        return ApiResponse.success("创建成功", noticeMap(notice));
    }

    @PutMapping("/notices/{id}")
    public ApiResponse<Map<String, Object>> updateNotice(@RequestHeader("X-Token") String token,
                                                          @PathVariable Long id,
                                                          @Valid @RequestBody NoticeRequest req) {
        User admin = authService.requireAdmin(token);
        Notice notice = noticeService.update(id, req, admin);
        return ApiResponse.success("更新成功", noticeMap(notice));
    }

    @DeleteMapping("/notices/{id}")
    public ApiResponse<Object> deleteNotice(@RequestHeader("X-Token") String token,
                                            @PathVariable Long id) {
        User admin = authService.requireAdmin(token);
        noticeService.delete(id, admin);
        return ApiResponse.success("删除成功", null);
    }

    @GetMapping("/notices")
    public ApiResponse<List<Map<String, Object>>> notices(@RequestHeader("X-Token") String token,
                                                           @RequestParam(defaultValue = "0") int page,
                                                           @RequestParam(defaultValue = "10") int size) {
        authService.requireAdmin(token);
        Page<Notice> result = noticeService.listAll(page, size);
        List<Map<String, Object>> data = result.getContent().stream().map(this::noticeMap).toList();
        return ApiResponse.success("查询成功", data, pagination(result));
    }

    private Map<String, Object> success(String message, Object data) {
        Map<String, Object> result = new HashMap<>();
        result.put("message", message);
        result.put("data", data);
        return result;
    }

    private Map<String, Object> success(String message, Object data, Map<String, Object> pagination) {
        Map<String, Object> result = success(message, data);
        result.put("pagination", pagination);
        return result;
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

    private UserRole parseRole(String role) {
        if (role == null || role.isBlank()) {
            return null;
        }
        try {
            return UserRole.valueOf(role.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private Map<String, Object> userMap(User user) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", user.getId());
        map.put("username", user.getUsername());
        map.put("realName", user.getRealName());
        map.put("phone", user.getPhone());
        map.put("idCard", user.getIdCard());
        map.put("role", user.getRole());
        map.put("createdAt", user.getCreatedAt());
        return map;
    }

    private Map<String, Object> noticeMap(Notice notice) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", notice.getId());
        map.put("title", notice.getTitle());
        map.put("summary", notice.getSummary());
        map.put("content", notice.getContent());
        map.put("published", notice.getPublished());
        map.put("publishedAt", notice.getPublishedAt());
        map.put("createdAt", notice.getCreatedAt());
        map.put("updatedAt", notice.getUpdatedAt());
        return map;
    }

    private Map<String, Object> logMap(AdminOperationLog log) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", log.getId());
        map.put("adminId", log.getAdmin() == null ? null : log.getAdmin().getId());
        map.put("adminName", log.getAdmin() == null ? "" : log.getAdmin().getRealName());
        map.put("adminUsername", log.getAdmin() == null ? "" : log.getAdmin().getUsername());
        map.put("operation", log.getOperation());
        map.put("detail", log.getDetail());
        map.put("result", log.getResult());
        map.put("durationMs", log.getDurationMs());
        map.put("clientIp", log.getClientIp());
        map.put("userAgent", log.getUserAgent());
        map.put("createdAt", log.getCreatedAt());
        return map;
    }

    private LocalDateTime parseDateTime(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return LocalDateTime.parse(value);
        } catch (DateTimeParseException ex) {
            return null;
        }
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
