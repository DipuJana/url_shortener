package com.jana.url_shortener.service;

import com.jana.url_shortener.dto.ShortenUrlRequest;
import com.jana.url_shortener.dto.UrlAnalyticsResponse;
import com.jana.url_shortener.dto.UrlResponse;
import com.jana.url_shortener.entity.UrlMapping;
import com.jana.url_shortener.entity.User;
import com.jana.url_shortener.exception.ResourceNotFoundException;
import com.jana.url_shortener.repository.UrlMappingRepository;
import com.jana.url_shortener.repository.UserRepository;
import com.jana.url_shortener.security.CustomUserDetails;
import com.jana.url_shortener.util.Base62Util;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class UrlService {

    private final UrlMappingRepository urlMappingRepository;
    private final UserRepository userRepository;
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

        // 1. Resolve current authenticated user proxy (zero DB SELECT query overhead)
        CustomUserDetails userDetails = (CustomUserDetails) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        User userReference = userRepository.getReferenceById(userDetails.getId());

        boolean hasCustomAlias = request.customAlias() != null && !request.customAlias().isBlank();
        String alias = hasCustomAlias ? request.customAlias().trim() : null;

        if (hasCustomAlias) {
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

        // Phase 1: Build entity with shortCode = alias (or null if auto-generated)
        UrlMapping urlMapping = UrlMapping.builder()
                .shortCode(alias)
                .originalUrl(request.longUrl())
                .expiresAt(expiresAt)
                .user(userReference)
                .build();

        UrlMapping savedMapping = urlMappingRepository.save(urlMapping);

        // Phase 2: Encode auto-increment ID to Base62 if no custom alias was supplied
        if (!hasCustomAlias) {
            String base62Code = Base62Util.encode(savedMapping.getId());
            savedMapping.setShortCode(base62Code);
            // JPA dirty checking executes UPDATE short_code before transaction commit
        }

        redisCacheService.cacheUrl(savedMapping.getShortCode(), savedMapping.getOriginalUrl(), DEFAULT_CACHE_TTL);

        log.info("Successfully persisted short code [{}] for User ID [{}]",
                savedMapping.getShortCode(), userDetails.getId());

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

        UrlMapping mapping = findUrlAndVerifyOwnership(id);

        String generatedShortUrl = "http://localhost:8080/" + mapping.getShortCode();

        return new UrlResponse(
                mapping.getShortCode(),
                generatedShortUrl,
                mapping.getClickCount(),
                mapping.getExpiresAt()
        );
    }

    @Transactional(readOnly = true)
    public UrlAnalyticsResponse getUrlAnalytics(Long id) {
        log.info("Fetching analytics for URL ID: {}", id);

        UrlMapping mapping = findUrlAndVerifyOwnership(id);

        boolean isExpired = mapping.getExpiresAt() != null
                && mapping.getExpiresAt().isBefore(LocalDateTime.now());

        return new UrlAnalyticsResponse(
                mapping.getShortCode(),
                mapping.getOriginalUrl(),
                mapping.getClickCount(),
                mapping.getCreatedAt(),
                mapping.getExpiresAt(),
                isExpired
        );
    }


    private UrlMapping findUrlAndVerifyOwnership(Long id) {
        CustomUserDetails userDetails = (CustomUserDetails) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();

        UrlMapping mapping = urlMappingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Short URL not found for ID: " + id));

        if (!mapping.getUser().getId().equals(userDetails.getId())) {
            log.warn("Unauthorized access attempt by User ID [{}] on URL ID [{}]", userDetails.getId(), id);
            throw new AccessDeniedException("You do not have permission to view this URL resource");
        }

        return mapping;
    }
}