package com.lms.service;

import com.lms.dto.RegisterRequest;
import com.lms.dto.UpdateProfileRequest;
import com.lms.exception.BusinessException;
import com.lms.model.User;
import com.lms.model.UserRole;
import com.lms.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public User register(RegisterRequest req, UserRole role) {
        if (userRepository.existsByUsername(req.getUsername())) {
            throw new BusinessException("用户名已存在");
        }
        User user = new User();
        user.setUsername(req.getUsername());
        user.setRealName(req.getRealName());
        user.setPhone(req.getPhone());
        user.setIdCard(req.getIdCard());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setRole(role);
        user.setCreatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }

    public User login(String username, String password) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new BusinessException("账号不存在"));
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new BusinessException("密码错误");
        }
        return user;
    }

    @Transactional
    public User updateProfile(User user, UpdateProfileRequest req) {
        user.setRealName(req.getRealName());
        user.setPhone(req.getPhone());
        user.setIdCard(req.getIdCard());
        return userRepository.save(user);
    }

    public User findById(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new BusinessException("用户不存在"));
    }

    public List<User> listAllUsers() {
        return userRepository.findAll();
    }

    public List<User> listAllUsers(UserRole role) {
        if (role == null) {
            return userRepository.findAll();
        }
        return userRepository.findAll().stream().filter(u -> u.getRole() == role).toList();
    }

    public Page<User> listUsersPaged(UserRole role, int page, int size) {
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(size, 100));
        Pageable pageable = PageRequest.of(safePage, safeSize);
        if (role == null) {
            return userRepository.findAllByOrderByCreatedAtDesc(pageable);
        }
        return userRepository.findByRoleOrderByCreatedAtDesc(role, pageable);
    }

    @Transactional
    public User resetPassword(Long userId, String newPassword) {
        User user = findById(userId);
        user.setPassword(passwordEncoder.encode(newPassword));
        return userRepository.save(user);
    }

    @Transactional
    public User changePassword(User user, String oldPassword, String newPassword) {
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new BusinessException("当前密码不正确");
        }
        if (oldPassword.equals(newPassword)) {
            throw new BusinessException("新密码不能与当前密码相同");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        return userRepository.save(user);
    }
}
