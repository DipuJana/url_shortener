package com.jana.url_shortener.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import org.hibernate.validator.constraints.URL;

public record ShortenUrlRequest(
        @NotBlank(message = "Original URL cannot be empty")
        @URL(message = "Please provide a valid long URL string")
        String longUrl,

        String customAlias,

        @Positive(message = "TTL must be a positive number of days")
        Integer ttlInDays
) {}