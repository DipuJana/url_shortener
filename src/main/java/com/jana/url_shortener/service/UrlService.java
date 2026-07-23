package com.jana.url_shortener.service;

import com.jana.url_shortener.dto.ShortenUrlRequest;
import com.jana.url_shortener.dto.UrlResponse;
import com.jana.url_shortener.entity.UrlMapping;
import com.jana.url_shortener.exception.ResourceNotFoundException;
import com.jana.url_shortener.repository.UrlMappingRepository;
import com.jana.url_shortener.util.Base62Util;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class UrlService {

    private final UrlMappingRepository urlMappingRepository;
    private final RedisCacheService redisCacheService;
    private final AnalyticsService analyticsService;

    private static final Duration DEFAULT_CACHE_TTL = Duration.ofHours(24);

    // Block system routes from ever being claimed as custom aliases
    private static final Set<String> RESERVED_KEYWORDS = Set.of(
            "api", "admin", "login", "health", "metrics", "swagger-ui", "actuator", "v1"
    );

    @Transactional
    public UrlResponse createShortUrl(ShortenUrlRequest request) {
        log.info("Processing request to shorten URL: {}", request.longUrl());

        boolean hasCustomAlias = request.customAlias() != null && !request.customAlias().isBlank();

        if (hasCustomAlias) {
            String alias = request.customAlias().trim();
            if (RESERVED_KEYWORDS.contains(alias.toLowerCase())) {
                throw new IllegalArgumentException("The alias '" + alias + "' is a system-reserved keyword.");
            }
            if (urlMappingRepository.existsByShortCode(alias)) {
                throw new IllegalArgumentException("Custom alias already exists: " + alias);
            }
        }

        LocalDateTime expiresAt = null;
        if (request.ttlInDays() != null) {
            expiresAt = LocalDateTime.now().plusDays(request.ttlInDays());
        }

        // Set shortCode to user's custom alias if present, otherwise NULL.
        UrlMapping urlMapping = UrlMapping.builder()
                .shortCode(hasCustomAlias ? request.customAlias().trim() : null)
                .originalUrl(request.longUrl())
                .expiresAt(expiresAt)
                .build();

        // Phase 1: Persist entity to generate database primary key
        UrlMapping savedMapping = urlMappingRepository.save(urlMapping);

        // Phase 2: Convert auto-increment ID to Base62 if no custom alias was supplied
        if (!hasCustomAlias) {
            String base62Code = Base62Util.encode(savedMapping.getId());
            savedMapping.setShortCode(base62Code);
            // JPA dirty checking updates short_code before transaction commit
        }

        log.info("Successfully persisted short code [{}] for URL ID [{}]",
                savedMapping.getShortCode(), savedMapping.getId());

        String generatedShortUrl = "http://localhost:8080/" + savedMapping.getShortCode();

        return new UrlResponse(
                savedMapping.getShortCode(),
                generatedShortUrl,
                savedMapping.getClickCount(),
                savedMapping.getExpiresAt()
        );
    }

    @Transactional(readOnly = true)
    public String getOriginalUrlAndValidate(String shortCode) {
        log.info("Resolving redirect for short code: {}", shortCode);

        // 1. CHECK REDIS CACHE FIRST
        Optional<String> cachedUrl = redisCacheService.getOriginalUrl(shortCode);
        if (cachedUrl.isPresent()) {
            // Asynchronous non-blocking write
            analyticsService.incrementClickCountAsync(shortCode);
            return cachedUrl.get();
        }

        // 2. CACHE MISS -> FALLBACK TO MYSQL
        UrlMapping mapping = urlMappingRepository.findByShortCode(shortCode)
                .orElseThrow(() -> new ResourceNotFoundException("Short URL not found for code: " + shortCode));

        if (mapping.getExpiresAt() != null && mapping.getExpiresAt().isBefore(LocalDateTime.now())) {
            log.warn("Attempted access to expired short code: {}", shortCode);
            throw new IllegalArgumentException("Short URL has expired");
        }

        // 3. STORE IN REDIS FOR FUTURE READS
        redisCacheService.cacheUrl(shortCode, mapping.getOriginalUrl(), DEFAULT_CACHE_TTL);

        analyticsService.incrementClickCountAsync(shortCode);

        return mapping.getOriginalUrl();
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
                mapping.getClickCount(),
                mapping.getExpiresAt()
        );
    }
}