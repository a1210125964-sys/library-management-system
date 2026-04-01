package com.lms.controller;

import com.lms.dto.LoginRequest;
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
    public Map<String, Object> register(@Valid @RequestBody RegisterRequest req) {
        User user = userService.register(req, UserRole.USER);
        return success("注册成功", userMap(user));
    }

    @PostMapping("/register-admin")
    public Map<String, Object> registerAdmin(@Valid @RequestBody RegisterRequest req,
                                             @RequestHeader("X-Token") String token) {
        authService.requireAdmin(token);
        User user = userService.register(req, UserRole.ADMIN);
        return success("管理员注册成功", userMap(user));
    }

    @PostMapping("/login")
    public Map<String, Object> login(@Valid @RequestBody LoginRequest req) {
        User user = userService.login(req.getUsername(), req.getPassword());
        String token = authService.issueToken(user);

        Map<String, Object> data = userMap(user);
        data.put("token", token);
        return success("登录成功", data);
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
        return map;
    }
}
