package com.jana.url_shortener.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jana.url_shortener.dto.AuthResponse;
import com.jana.url_shortener.dto.LoginRequest;
import com.jana.url_shortener.dto.RegisterRequest;
import com.jana.url_shortener.dto.ShortenUrlRequest;
import com.jana.url_shortener.repository.UrlMappingRepository;
import com.jana.url_shortener.repository.UserRepository;
import com.jana.url_shortener.service.RedisCacheService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class RateLimitingIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UrlMappingRepository urlMappingRepository;

    @MockitoBean
    private RedisCacheService redisCacheService;

    @BeforeEach
    void setUp() {
        // Child table must always be cleared before the parent table to avoid FK violations
        urlMappingRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("Anonymous Rate Limiting: 6th POST request from same IP within 1 minute returns 429 Too Many Requests")
    void anonymousUser_ExceedsRateLimit_Returns429() throws Exception {
        RegisterRequest request = new RegisterRequest("ratelimit@example.com", "password123");
        String payload = objectMapper.writeValueAsString(request);
        String clientIp = "203.0.113.10";

        for (int i = 1; i <= 5; i++) {
            mockMvc.perform(post("/api/v1/auth/register")
                            .header("X-Forwarded-For", clientIp)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(payload))
                    .andExpect(status().is(i == 1 ? 201 : 400));
        }

        mockMvc.perform(post("/api/v1/auth/register")
                        .header("X-Forwarded-For", clientIp)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("X-Rate-Limit-Retry-After-Seconds"))
                .andExpect(jsonPath("$.error").value("Too Many Requests"))
                .andExpect(jsonPath("$.message").value(containsString("Rate limit exceeded")));
    }

    @Test
    @DisplayName("Authenticated Rate Limiting: 21st POST request from same User ID returns 429 Too Many Requests")
    void authenticatedUser_ExceedsRateLimit_Returns429() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                .header("X-Forwarded-For", "203.0.113.20")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new RegisterRequest("auth-limit@test.com", "password123"))));

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .header("X-Forwarded-For", "203.0.113.20")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("auth-limit@test.com", "password123"))))
                .andExpect(status().isOk())
                .andReturn();

        AuthResponse auth = objectMapper.readValue(loginResult.getResponse().getContentAsString(), AuthResponse.class);
        String jwtToken = auth.token();

        ShortenUrlRequest request = new ShortenUrlRequest("https://spring.io", null, null);
        String payload = objectMapper.writeValueAsString(request);

        for (int i = 1; i <= 20; i++) {
            mockMvc.perform(post("/api/v1/urls")
                            .header("Authorization", "Bearer " + jwtToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(payload))
                    .andExpect(status().isCreated());
        }

        mockMvc.perform(post("/api/v1/urls")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("X-Rate-Limit-Retry-After-Seconds"))
                .andExpect(jsonPath("$.error").value("Too Many Requests"));
    }
}