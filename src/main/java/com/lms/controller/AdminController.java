package com.lms.controller;

import com.lms.dto.ConfigUpdateRequest;
import com.lms.dto.ResetPasswordRequest;
import com.lms.model.AdminOperationLog;
import com.lms.model.User;
import com.lms.service.AdminLogService;
import com.lms.service.AuthService;
import com.lms.service.StatisticsService;
import com.lms.service.SystemConfigService;
import com.lms.service.UserService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
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

    public AdminController(AuthService authService,
                           StatisticsService statisticsService,
                           SystemConfigService systemConfigService,
                           AdminLogService adminLogService,
                           UserService userService) {
        this.authService = authService;
        this.statisticsService = statisticsService;
        this.systemConfigService = systemConfigService;
        this.adminLogService = adminLogService;
        this.userService = userService;
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
                                             @Valid @RequestBody ConfigUpdateRequest req) {
        User admin = authService.requireAdmin(token);
        Map<String, String> configs = systemConfigService.update(req);
        adminLogService.log(admin, "更新系统参数", configs.toString());
        return success("更新成功", configs);
    }

    @GetMapping("/users")
    public Map<String, Object> users(@RequestHeader("X-Token") String token) {
        authService.requireAdmin(token);
        List<Map<String, Object>> users = userService.listAllUsers().stream().map(this::userMap).collect(Collectors.toList());
        return success("查询成功", users);
    }

    @PostMapping("/users/{id}/reset-password")
    public Map<String, Object> resetPassword(@RequestHeader("X-Token") String token,
                                             @PathVariable Long id,
                                             @Valid @RequestBody ResetPasswordRequest req) {
        User admin = authService.requireAdmin(token);
        User user = userService.resetPassword(id, req.getNewPassword());
        adminLogService.log(admin, "重置用户密码", "userId=" + id);
        return success("密码重置成功", userMap(user));
    }

    @GetMapping("/logs")
    public Map<String, Object> logs(@RequestHeader("X-Token") String token) {
        authService.requireAdmin(token);
        List<Map<String, Object>> data = adminLogService.recentLogs().stream().map(this::logMap).collect(Collectors.toList());
        return success("查询成功", data);
    }

    private Map<String, Object> success(String message, Object data) {
        Map<String, Object> result = new HashMap<>();
        result.put("message", message);
        result.put("data", data);
        return result;
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

    private Map<String, Object> logMap(AdminOperationLog log) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", log.getId());
        map.put("adminId", log.getAdmin() == null ? null : log.getAdmin().getId());
        map.put("adminName", log.getAdmin() == null ? "" : log.getAdmin().getRealName());
        map.put("adminUsername", log.getAdmin() == null ? "" : log.getAdmin().getUsername());
        map.put("operation", log.getOperation());
        map.put("detail", log.getDetail());
        map.put("createdAt", log.getCreatedAt());
        return map;
    }
}
