package com.jana.url_shortener.service;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class RateLimitingService {

    private final Map<String, Bucket> cache = new ConcurrentHashMap<>();

    public Bucket resolveBucket(String key) {
        return cache.computeIfAbsent(key, k -> {
            log.debug("Initializing new rate limiting bucket for client key [{}]", k);
            return createNewBucket();
        });
    }

    private Bucket createNewBucket() {
        // Refill 10 tokens every 1 minute
        Refill refill = Refill.greedy(1, Duration.ofMinutes(1));
        Bandwidth limit = Bandwidth.classic(1, refill);
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }
}