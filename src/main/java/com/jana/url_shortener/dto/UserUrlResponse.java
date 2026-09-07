package com.jana.url_shortener.dto;

import java.time.LocalDateTime;

public record UserUrlResponse(
        Long id,
        String originalUrl,
        String shortCode,
        String shortUrl,
        Long clickCount,
        LocalDateTime createdAt,
        LocalDateTime expiresAt
) {}