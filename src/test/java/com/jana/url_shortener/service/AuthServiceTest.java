package com.jana.url_shortener.service;

import com.jana.url_shortener.dto.AuthResponse;
import com.jana.url_shortener.dto.LoginRequest;
import com.jana.url_shortener.dto.RegisterRequest;
import com.jana.url_shortener.entity.Role;
import com.jana.url_shortener.entity.User;
import com.jana.url_shortener.repository.UserRepository;
import com.jana.url_shortener.security.JwtUtils;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtUtils jwtUtils;

    @InjectMocks
    private AuthService authService;

    @Test
    @DisplayName("Should register new user and encode password")
    void register_Success() {

        RegisterRequest request =
                new RegisterRequest("dev@test.com", "password123");

        when(userRepository.existsByEmail("dev@test.com"))
                .thenReturn(false);

        when(passwordEncoder.encode("password123"))
                .thenReturn("encoded_pass");

        authService.register(request);

        verify(userRepository)
                .existsByEmail("dev@test.com");

        verify(passwordEncoder)
                .encode("password123");

        verify(userRepository)
                .save(any(User.class));
    }

    @Test
    @DisplayName("Should throw exception if email is already registered")
    void register_DuplicateEmail_ThrowsException() {

        RegisterRequest request =
                new RegisterRequest("existing@test.com", "password123");

        when(userRepository.existsByEmail("existing@test.com"))
                .thenReturn(true);

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> authService.register(request)
        );

        assertTrue(
                ex.getMessage().contains("Email is already registered")
        );

        verify(userRepository, never())
                .save(any(User.class));

        verify(passwordEncoder, never())
                .encode(anyString());
    }

    @Test
    @DisplayName("Should authenticate user and return JWT token")
    void login_Success() {

        LoginRequest request =
                new LoginRequest("dev@test.com", "password123");

        Authentication authentication =
                mock(Authentication.class);

        when(authenticationManager.authenticate(
                any(UsernamePasswordAuthenticationToken.class)
        )).thenReturn(authentication);

        when(jwtUtils.generateJwtToken(authentication))
                .thenReturn("mocked_jwt_token");

        AuthResponse response =
                authService.login(request);

        assertNotNull(response);

        assertEquals(
                "mocked_jwt_token",
                response.token()
        );

        assertEquals(
                "Bearer",
                response.type()
        );

        verify(authenticationManager)
                .authenticate(any(UsernamePasswordAuthenticationToken.class));

        verify(jwtUtils)
                .generateJwtToken(authentication);
    }

    @Test
    @DisplayName("Should throw BadCredentialsException for invalid credentials")
    void login_InvalidCredentials_ThrowsException() {

        LoginRequest request =
                new LoginRequest("dev@test.com", "wrong_pass");

        when(authenticationManager.authenticate(
                any(UsernamePasswordAuthenticationToken.class)
        )).thenThrow(
                new BadCredentialsException("Bad credentials")
        );

        assertThrows(
                BadCredentialsException.class,
                () -> authService.login(request)
        );

        verify(jwtUtils, never())
                .generateJwtToken(any());
    }
}