package com.jana.url_shortener.service;

import com.jana.url_shortener.dto.AuthResponse;
import com.jana.url_shortener.dto.LoginRequest;
import com.jana.url_shortener.dto.RegisterRequest;
import com.jana.url_shortener.entity.Role;
import com.jana.url_shortener.entity.User;
import com.jana.url_shortener.repository.UserRepository;
import com.jana.url_shortener.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;

    @Transactional
    public void register(RegisterRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();

        if (userRepository.existsByEmail(normalizedEmail)) {
            log.warn("Registration failed. Email already exists: {}", normalizedEmail);
            throw new IllegalArgumentException("Email is already registered");
        }

        User user = User.builder()
                .email(normalizedEmail)
                .password(passwordEncoder.encode(request.password()))
                .role(Role.ROLE_USER)
                .build();

        userRepository.save(user);
        log.info("Successfully registered user with email: {}", normalizedEmail);
    }

    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(normalizedEmail, request.password())
        );

        String jwtToken = jwtUtils.generateJwtToken(authentication);
        log.info("User logged in successfully: {}", normalizedEmail);

        return new AuthResponse(jwtToken);
    }
}