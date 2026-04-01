package com.lms.controller;

import com.lms.dto.ChangePasswordRequest;
import com.lms.dto.UpdateProfileRequest;
import com.lms.model.User;
import com.lms.service.AuthService;
import com.lms.service.UserService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final AuthService authService;
    private final UserService userService;

    public UserController(AuthService authService, UserService userService) {
        this.authService = authService;
        this.userService = userService;
    }

    @GetMapping("/me")
    public Map<String, Object> me(@RequestHeader("X-Token") String token) {
        User user = authService.requireUser(token);
        return success("查询成功", userMap(user));
    }

    @PutMapping("/me")
    public Map<String, Object> updateMe(@RequestHeader("X-Token") String token,
                                         @Valid @RequestBody UpdateProfileRequest req) {
        User user = authService.requireUser(token);
        User updated = userService.updateProfile(user, req);
        return success("更新成功", userMap(updated));
    }

    @PostMapping("/me/change-password")
    public Map<String, Object> changeMyPassword(@RequestHeader("X-Token") String token,
                                                 @Valid @RequestBody ChangePasswordRequest req) {
        User user = authService.requireUser(token);
        userService.changePassword(user, req.getOldPassword(), req.getNewPassword());
        return success("密码修改成功", null);
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
