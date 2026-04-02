package com.lms.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lms.model.User;
import com.lms.model.UserRole;
import com.lms.service.AuthService;
import com.lms.service.UserService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserService userService;

    @MockBean
    private AuthService authService;

    @Test
    void login_should_return_access_token_and_refresh_token() throws Exception {
        User user = new User();
        user.setId(1L);
        user.setUsername("alice");
        user.setRealName("Alice");
        user.setPhone("13800000000");
        user.setIdCard("110101199001010011");
        user.setRole(UserRole.USER);

        Mockito.when(userService.login("alice", "123456")).thenReturn(user);
        Mockito.when(authService.issueAccessToken(user)).thenReturn("access-token");
        Mockito.when(authService.issueRefreshToken(user)).thenReturn("refresh-token");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "username", "alice",
                    "password", "123456"
                ))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.accessToken").exists())
            .andExpect(jsonPath("$.data.refreshToken").exists());
    }

    @Test
    void refresh_should_be_public_and_return_new_access_token() throws Exception {
        Mockito.when(authService.refreshAccessToken("refresh-token")).thenReturn("new-access-token");

        mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "refreshToken", "refresh-token"
                ))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.accessToken").exists());
    }
}
