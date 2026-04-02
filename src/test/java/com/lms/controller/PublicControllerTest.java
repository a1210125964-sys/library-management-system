package com.lms.controller;

import com.lms.config.SecurityConfig;
import com.lms.config.TokenAuthenticationFilter;
import com.lms.service.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = PublicController.class)
@AutoConfigureMockMvc
@Import({SecurityConfig.class, TokenAuthenticationFilter.class})
class PublicControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthService authService;

    @Test
    void public_api_should_be_accessible_without_token() throws Exception {
        mockMvc.perform(get("/api/public/stats"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value("SUCCESS"));
    }
}