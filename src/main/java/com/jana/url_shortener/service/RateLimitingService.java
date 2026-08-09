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
            if (k.startsWith("user:")) {
                log.debug("Initializing AUTHENTICATED rate limit bucket for [{}]", k);
                return createAuthenticatedBucket();
            } else {
                log.debug("Initializing ANONYMOUS IP rate limit bucket for [{}]", k);
                return createAnonymousBucket();
            }
        });
    }


    private Bucket createAuthenticatedBucket() {
        Refill refill = Refill.greedy(20, Duration.ofMinutes(1));
        Bandwidth limit = Bandwidth.classic(20, refill);
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }


    private Bucket createAnonymousBucket() {
        Refill refill = Refill.greedy(5, Duration.ofMinutes(1));
        Bandwidth limit = Bandwidth.classic(5, refill);
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }
}