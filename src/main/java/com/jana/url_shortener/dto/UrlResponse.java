package com.jana.url_shortener.dto;

import java.time.LocalDateTime;

public record UrlResponse(
        String shortCode,
        String shortUrl,
        LocalDateTime expiresAt
) {}