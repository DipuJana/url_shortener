package com.jana.url_shortener.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class RedisCacheService {

    private final StringRedisTemplate redisTemplate;
    private static final String KEY_PREFIX = "url:";

    /**
     * Fetch long URL from Redis cache.
     * Uses DEBUG level for hits/misses to avoid log pollution in high-throughput traffic.
     */
    public Optional<String> getOriginalUrl(String shortCode) {
        try {
            String key = KEY_PREFIX + shortCode;
            String originalUrl = redisTemplate.opsForValue().get(key);

            if (originalUrl != null) {
                log.debug("CACHE HIT for shortCode [{}]", shortCode);
                return Optional.of(originalUrl);
            }
        } catch (Exception e) {
            // Graceful Fallback: Log warning and let request safely degrade to MySQL query
            log.warn("Redis error on read for shortCode [{}]: {}", shortCode, e.getMessage());
        }

        log.debug("CACHE MISS for shortCode [{}]", shortCode);
        return Optional.empty();
    }

    /**
     * Cache shortCode -> originalUrl mapping with a Time-To-Live (TTL).
     */
    public void cacheUrl(String shortCode, String originalUrl, Duration ttl) {
        try {
            String key = KEY_PREFIX + shortCode;
            redisTemplate.opsForValue().set(key, originalUrl, ttl);
            log.debug("CACHED shortCode [{}] in Redis with TTL [{}]", shortCode, ttl);
        } catch (Exception e) {
            log.warn("Redis error on write for shortCode [{}]: {}", shortCode, e.getMessage());
        }
    }

    /**
     * Evict key from cache when a URL is deleted or modified.
     */
    public void evictUrl(String shortCode) {
        try {
            String key = KEY_PREFIX + shortCode;
            redisTemplate.delete(key);
            log.debug("EVICTED shortCode [{}] from Redis", shortCode);
        } catch (Exception e) {
            log.warn("Redis error on evict for shortCode [{}]: {}", shortCode, e.getMessage());
        }
    }
}