package com.lms.service;

import com.lms.exception.BusinessException;
import com.lms.model.User;
import com.lms.model.UserRole;
import com.lms.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private JwtService jwtService;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AuthService authService;

    @Test
    void requireUser_should_throw_when_token_invalid() {
        when(jwtService.parseAccessTokenUserId("bad-token")).thenReturn(Optional.empty());

        BusinessException ex = assertThrows(BusinessException.class, () -> authService.requireUser("bad-token"));

        assertEquals("登录已失效，请重新登录", ex.getMessage());
    }

    @Test
    void refreshAccessToken_should_return_new_access_token() {
        User user = new User();
        user.setId(10L);
        user.setRole(UserRole.USER);

        when(jwtService.parseRefreshTokenUserId("refresh-token")).thenReturn(Optional.of(10L));
        when(userRepository.findById(10L)).thenReturn(Optional.of(user));
        when(jwtService.createAccessToken(user)).thenReturn("new-access-token");

        String token = authService.refreshAccessToken("refresh-token");

        assertEquals("new-access-token", token);
    }
}
