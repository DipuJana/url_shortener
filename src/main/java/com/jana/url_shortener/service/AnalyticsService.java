package com.jana.url_shortener.service;

import com.jana.url_shortener.repository.UrlMappingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsService {

    private final UrlMappingRepository urlMappingRepository;

    /**
     * Executes asynchronously in the background thread pool 'analyticsTaskExecutor'.
     * The HTTP redirect response returns to the client immediately without waiting for this method to finish.
     */
    @Async("analyticsTaskExecutor")
    @Transactional
    public void incrementClickCountAsync(String shortCode) {
        try {
            urlMappingRepository.incrementClickCount(shortCode);
            log.debug("Async click count incremented for shortCode [{}] on thread [{}]",
                    shortCode, Thread.currentThread().getName());
        } catch (Exception e) {
            log.error("Failed to asynchronously increment click count for shortCode [{}]: {}",
                    shortCode, e.getMessage());
        }
    }
}