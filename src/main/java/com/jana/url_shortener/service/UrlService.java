package com.jana.url_shortener.service;

import com.jana.url_shortener.dto.ShortenUrlRequest;
import com.jana.url_shortener.dto.UrlResponse;
import com.jana.url_shortener.entity.UrlMapping;
import com.jana.url_shortener.repository.UrlMappingRepository;
import com.jana.url_shortener.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class UrlService {

    private final UrlMappingRepository urlMappingRepository;

    @Transactional
    public UrlResponse createShortUrl(ShortenUrlRequest request) {
        log.info("Processing request to shorten URL: {}", request.longUrl());

        String generatedCode = UUID.randomUUID().toString().substring(0, 8);

        // Choose the final short code string based on user input
        String finalShortCode = (request.customAlias() != null && !request.customAlias().isBlank())
                ? request.customAlias()
                : generatedCode;

        // A single clean database unique check constraint
        if (urlMappingRepository.existsByShortCode(finalShortCode)) {
            throw new IllegalArgumentException("Short code or alias already exists: " + finalShortCode);
        }

        LocalDateTime expiresAt = null;
        if (request.ttlInDays() != null) {
            expiresAt = LocalDateTime.now().plusDays(request.ttlInDays());
        }

        // Normalized builder pattern containing zero duplicate alias fields
        UrlMapping urlMapping = UrlMapping.builder()
                .shortCode(finalShortCode)
                .originalUrl(request.longUrl())
                .expiresAt(expiresAt)
                .build();

        UrlMapping savedMapping = urlMappingRepository.save(urlMapping);
        log.info("Successfully persisted short code [{}] for URL", savedMapping.getShortCode());

        String generatedShortUrl = "http://localhost:8080/" + savedMapping.getShortCode();

        return new UrlResponse(
                savedMapping.getShortCode(),
                generatedShortUrl,
                savedMapping.getExpiresAt()
        );
    }

    @Transactional(readOnly = true)
    public UrlResponse getUrlMetadata(Long id) {
        log.info("Fetching metadata for URL ID: {}", id);
        UrlMapping mapping = urlMappingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("URL mapping not found for ID: " + id));

        String generatedShortUrl = "http://localhost:8080/" + mapping.getShortCode();

        return new UrlResponse(
                mapping.getShortCode(),
                generatedShortUrl,
                mapping.getExpiresAt()
        );
    }
}