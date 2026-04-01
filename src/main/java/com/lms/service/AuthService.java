package com.lms.service;

import com.lms.exception.BusinessException;
import com.lms.model.User;
import com.lms.model.UserRole;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthService {

    private final Map<String, User> tokenStore = new ConcurrentHashMap<>();

    public String issueToken(User user) {
        String token = UUID.randomUUID().toString();
        tokenStore.put(token, user);
        return token;
    }

    public User requireUser(String token) {
        if (token == null || token.isBlank()) {
            throw new BusinessException("请先登录");
        }
        User user = tokenStore.get(token);
        if (user == null) {
            throw new BusinessException("登录已失效，请重新登录");
        }
        return user;
    }

    public User requireAdmin(String token) {
        User user = requireUser(token);
        if (user.getRole() != UserRole.ADMIN) {
            throw new BusinessException("仅管理员可执行此操作");
        }
        return user;
    }
}
