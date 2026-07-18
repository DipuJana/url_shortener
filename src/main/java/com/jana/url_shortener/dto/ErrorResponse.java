package com.jana.url_shortener.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;
import java.util.Map;

// Hide the validationErrors field entirely if it's null (e.g., for 404 errors)
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(
        LocalDateTime timestamp,
        String error,
        String message,
        String path,
        Map<String, String> validationErrors
) {
    // Compact constructor for standard errors (sets validationErrors to null)
    public ErrorResponse(String error, String message, String path) {
        this(LocalDateTime.now(), error, message, path, null);
    }
}