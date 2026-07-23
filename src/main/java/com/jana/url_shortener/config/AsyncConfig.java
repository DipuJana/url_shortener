package com.jana.url_shortener.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean(name = "analyticsTaskExecutor")
    public Executor analyticsTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);       // Minimum active threads
        executor.setMaxPoolSize(20);      // Maximum threads under peak traffic
        executor.setQueueCapacity(500);   // Buffer queue for pending click tasks
        executor.setThreadNamePrefix("AsyncAnalytics-");
        executor.initialize();
        return executor;
    }
}