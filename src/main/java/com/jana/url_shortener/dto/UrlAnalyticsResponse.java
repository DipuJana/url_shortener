package com.jana.url_shortener.dto;

import java.time.LocalDateTime;

public record UrlAnalyticsResponse(
        String shortCode,
        String originalUrl,
        Long totalClicks,
        LocalDateTime createdAt,
        LocalDateTime expiresAt,
        boolean isExpired
) {}