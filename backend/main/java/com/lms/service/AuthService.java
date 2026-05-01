package com.lms.service;

import com.lms.exception.BusinessException;
import com.lms.model.User;
import com.lms.model.UserRole;
import com.lms.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public AuthService(JwtService jwtService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    public String issueAccessToken(User user) {
        return jwtService.createAccessToken(user);
    }

    public String issueRefreshToken(User user) {
        return jwtService.createRefreshToken(user);
    }

    public String refreshAccessToken(String refreshToken) {
        Long userId = jwtService.parseRefreshTokenUserId(refreshToken)
            .orElseThrow(() -> new BusinessException("刷新令牌无效或已过期"));
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException("用户不存在或已被删除"));
        return issueAccessToken(user);
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
        return jwtService.parseAccessTokenUserId(token).flatMap(userRepository::findById);
    }

    public User requireAdmin(String token) {
        User user = requireUser(token);
        if (user.getRole() != UserRole.ADMIN) {
            throw new BusinessException("仅管理员可执行此操作");
        }
        return user;
    }
}
