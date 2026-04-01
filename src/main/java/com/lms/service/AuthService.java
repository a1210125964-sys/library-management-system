package com.lms.service;

import com.lms.exception.BusinessException;
import com.lms.model.User;
import com.lms.model.UserRole;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthService {

    private final Map<String, TokenSession> tokenStore = new ConcurrentHashMap<>();
    private final long tokenExpireHours;

    public AuthService(@Value("${app.auth.token-expire-hours:12}") long tokenExpireHours) {
        this.tokenExpireHours = tokenExpireHours;
    }

    public String issueToken(User user) {
        String token = UUID.randomUUID().toString();
        tokenStore.put(token, new TokenSession(user, LocalDateTime.now().plusHours(Math.max(1, tokenExpireHours))));
        return token;
    }

    public User requireUser(String token) {
        if (token == null || token.isBlank()) {
            throw new BusinessException("请先登录");
        }
        User user = findValidUser(token).orElse(null);
        if (user == null) {
            throw new BusinessException("登录已失效，请重新登录");
        }
        return user;
    }

    public Optional<User> findValidUser(String token) {
        if (token == null || token.isBlank()) {
            return Optional.empty();
        }
        TokenSession session = tokenStore.get(token);
        if (session == null) {
            return Optional.empty();
        }
        if (session.expireAt().isBefore(LocalDateTime.now())) {
            tokenStore.remove(token);
            return Optional.empty();
        }
        return Optional.of(session.user());
    }

    public User requireAdmin(String token) {
        User user = requireUser(token);
        if (user.getRole() != UserRole.ADMIN) {
            throw new BusinessException("仅管理员可执行此操作");
        }
        return user;
    }

    private record TokenSession(User user, LocalDateTime expireAt) {
    }
}
