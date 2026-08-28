package com.jana.url_shortener.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jana.url_shortener.dto.LoginRequest;
import com.jana.url_shortener.dto.RegisterRequest;
import com.jana.url_shortener.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void cleanUp() {
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("POST /api/v1/auth/register - Successfully registers user")
    void register_Success() throws Exception {
        RegisterRequest request = new RegisterRequest("test@example.com", "password123");

        mockMvc.perform(post("/api/v1/auth/register")
                        .header("X-Forwarded-For", "192.168.1.101")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(content().string(containsString("User registered successfully")));
    }

    @Test
    @DisplayName("POST /api/v1/auth/register - Duplicate email returns 400 Bad Request")
    void register_DuplicateEmail_Returns400() throws Exception {
        RegisterRequest request = new RegisterRequest("duplicate@example.com", "password123");

        // 1st Registration
        mockMvc.perform(post("/api/v1/auth/register")
                        .header("X-Forwarded-For", "192.168.1.102")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        // 2nd Duplicate Registration
        mockMvc.perform(post("/api/v1/auth/register")
                        .header("X-Forwarded-For", "192.168.1.102")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value(containsString("already registered")));
    }

    @Test
    @DisplayName("POST /api/v1/auth/login - Valid credentials return JWT Bearer token")
    void login_Success() throws Exception {
        RegisterRequest registerReq = new RegisterRequest("login@example.com", "password123");
        mockMvc.perform(post("/api/v1/auth/register")
                .header("X-Forwarded-For", "192.168.1.103")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerReq)));

        LoginRequest loginReq = new LoginRequest("login@example.com", "password123");
        mockMvc.perform(post("/api/v1/auth/login")
                        .header("X-Forwarded-For", "192.168.1.103")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.type").value("Bearer"));
    }

    @Test
    @DisplayName("POST /api/v1/auth/login - Invalid password returns 401 Unauthorized")
    void login_InvalidPassword_Returns401() throws Exception {
        RegisterRequest registerReq = new RegisterRequest("wrongpass@example.com", "password123");
        mockMvc.perform(post("/api/v1/auth/register")
                .header("X-Forwarded-For", "192.168.1.104")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerReq)));

        LoginRequest loginReq = new LoginRequest("wrongpass@example.com", "wrongpassword");
        mockMvc.perform(post("/api/v1/auth/login")
                        .header("X-Forwarded-For", "192.168.1.104")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }
}