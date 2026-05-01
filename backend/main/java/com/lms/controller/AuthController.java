package com.lms.controller;

import com.lms.dto.LoginRequest;
import com.lms.dto.ApiResponse;
import com.lms.dto.RefreshTokenRequest;
import com.lms.dto.RegisterRequest;
import com.lms.model.User;
import com.lms.model.UserRole;
import com.lms.service.AuthService;
import com.lms.service.UserService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final AuthService authService;

    public AuthController(UserService userService, AuthService authService) {
        this.userService = userService;
        this.authService = authService;
    }

    @PostMapping("/register")
    public ApiResponse<Map<String, Object>> register(@Valid @RequestBody RegisterRequest req) {
        User user = userService.register(req, UserRole.USER);
        return ApiResponse.success("注册成功", userMap(user));
    }

    @PostMapping("/register-admin")
    public ApiResponse<Map<String, Object>> registerAdmin(@Valid @RequestBody RegisterRequest req,
                                                          @RequestHeader("X-Token") String token) {
        authService.requireAdmin(token);
        User user = userService.register(req, UserRole.ADMIN);
        return ApiResponse.success("管理员注册成功", userMap(user));
    }

    @PostMapping("/login")
    public ApiResponse<Map<String, Object>> login(@Valid @RequestBody LoginRequest req) {
        User user = userService.login(req.getUsername(), req.getPassword());
        String accessToken = authService.issueAccessToken(user);
        String refreshToken = authService.issueRefreshToken(user);

        Map<String, Object> data = userMap(user);
        data.put("accessToken", accessToken);
        data.put("refreshToken", refreshToken);
        data.put("token", accessToken);
        return ApiResponse.success("登录成功", data);
    }

    @PostMapping("/refresh")
    public ApiResponse<Map<String, Object>> refresh(@Valid @RequestBody RefreshTokenRequest req) {
        String accessToken = authService.refreshAccessToken(req.getRefreshToken());
        return ApiResponse.success("刷新成功", Map.of("accessToken", accessToken, "token", accessToken));
    }

    private Map<String, Object> userMap(User user) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", user.getId());
        map.put("username", user.getUsername());
        map.put("realName", user.getRealName());
        map.put("phone", user.getPhone());
        map.put("idCard", user.getIdCard());
        map.put("role", user.getRole());
        return map;
    }
}
