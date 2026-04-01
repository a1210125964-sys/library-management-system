package com.lms.controller;

import com.lms.dto.ConfigUpdateRequest;
import com.lms.model.User;
import com.lms.service.AdminLogService;
import com.lms.service.AuthService;
import com.lms.service.StatisticsService;
import com.lms.service.SystemConfigService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AuthService authService;
    private final StatisticsService statisticsService;
    private final SystemConfigService systemConfigService;
    private final AdminLogService adminLogService;

    public AdminController(AuthService authService,
                           StatisticsService statisticsService,
                           SystemConfigService systemConfigService,
                           AdminLogService adminLogService) {
        this.authService = authService;
        this.statisticsService = statisticsService;
        this.systemConfigService = systemConfigService;
        this.adminLogService = adminLogService;
    }

    @GetMapping("/stats")
    public Map<String, Object> stats(@RequestHeader("X-Token") String token) {
        authService.requireAdmin(token);
        return success("查询成功", statisticsService.overview());
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

    private Map<String, Object> success(String message, Object data) {
        Map<String, Object> result = new HashMap<>();
        result.put("message", message);
        result.put("data", data);
        return result;
    }
}
