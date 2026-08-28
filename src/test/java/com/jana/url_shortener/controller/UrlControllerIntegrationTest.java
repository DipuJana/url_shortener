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

import java.util.Optional;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class UrlControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UrlMappingRepository urlMappingRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private RedisCacheService redisCacheService;

    private String userToken;
    private String secondUserToken;

    @BeforeEach
    void setUp() throws Exception {
        urlMappingRepository.deleteAll();
        userRepository.deleteAll();

        // Use dynamically randomized IPs to avoid Rate Limiter exhaustion across @BeforeEach runs
        userToken = obtainJwtToken("owner@example.com", "password123");
        secondUserToken = obtainJwtToken("other@example.com", "password123");

        when(redisCacheService.getOriginalUrl(any())).thenReturn(Optional.empty());
    }

    private String obtainJwtToken(String email, String password) throws Exception {
        String randomIp = "10.0." + (int) (Math.random() * 200) + "." + (int) (Math.random() * 200);

        mockMvc.perform(post("/api/v1/auth/register")
                .header("X-Forwarded-For", randomIp)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new RegisterRequest(email, password))));

        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .header("X-Forwarded-For", randomIp)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(email, password))))
                .andExpect(status().isOk())
                .andReturn();

        AuthResponse auth = objectMapper.readValue(result.getResponse().getContentAsString(), AuthResponse.class);
        return auth.token();
    }

    @Test
    @DisplayName("POST /api/v1/urls - Anonymous user returns 401 Unauthorized")
    void createShortUrl_Unauthenticated_Returns401() throws Exception {
        ShortenUrlRequest request = new ShortenUrlRequest("https://spring.io", null, null);

        mockMvc.perform(post("/api/v1/urls")
                        .header("X-Forwarded-For", "172.16.0.10")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/v1/urls - Authenticated user creates short URL successfully")
    void createShortUrl_Authenticated_Success() throws Exception {
        ShortenUrlRequest request = new ShortenUrlRequest("https://spring.io", "my-spring-link", 10);

        mockMvc.perform(post("/api/v1/urls")
                        .header("Authorization", "Bearer " + userToken)
                        .header("X-Forwarded-For", "172.16.0.11")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.shortCode").value("my-spring-link"))
                .andExpect(jsonPath("$.shortUrl").value("http://localhost:8080/my-spring-link"));
    }

    @Test
    @DisplayName("GET /{shortCode} - Public redirection returns 302 Found")
    void redirect_PublicAccess_Success() throws Exception {
        ShortenUrlRequest request = new ShortenUrlRequest("https://github.com", "my-github", null);
        mockMvc.perform(post("/api/v1/urls")
                        .header("Authorization", "Bearer " + userToken)
                        .header("X-Forwarded-For", "172.16.0.12")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/my-github")
                        .header("X-Forwarded-For", "172.16.0.13"))
                .andExpect(status().isFound())
                .andExpect(header().string("Location", "https://github.com"));
    }

    @Test
    @DisplayName("GET /api/v1/urls/{id}/analytics - Other user accessing analytics returns 403 Forbidden")
    void getAnalytics_UnauthorizedUser_Returns403() throws Exception {
        ShortenUrlRequest request = new ShortenUrlRequest("https://spring.io", "exclusive-link", null);
        mockMvc.perform(post("/api/v1/urls")
                        .header("Authorization", "Bearer " + userToken)
                        .header("X-Forwarded-For", "172.16.0.14")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        Long urlId = urlMappingRepository.findByShortCode("exclusive-link").orElseThrow().getId();

        mockMvc.perform(get("/api/v1/urls/" + urlId + "/analytics")
                        .header("Authorization", "Bearer " + secondUserToken)
                        .header("X-Forwarded-For", "172.16.0.15"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Forbidden"))
                .andExpect(jsonPath("$.message").value(containsString("You do not have permission")));
    }
}