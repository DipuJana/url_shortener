package com.jana.url_shortener.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jana.url_shortener.dto.ErrorResponse;
import com.jana.url_shortener.security.CustomUserDetails;
import com.jana.url_shortener.service.RateLimitingService;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
@RequiredArgsConstructor
@Slf4j
public class RateLimitingInterceptor implements HandlerInterceptor {

    private final RateLimitingService rateLimitingService;
    private final ObjectMapper objectMapper; // Spring-managed ObjectMapper (supports LocalDateTime)

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if ("POST".equalsIgnoreCase(request.getMethod())) {
            String clientKey = resolveClientKey(request);
            Bucket bucket = rateLimitingService.resolveBucket(clientKey);
            ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);

            if (!probe.isConsumed()) {
                long waitForRefillSecs = (long) Math.ceil(probe.getNanosToWaitForRefill() / 1_000_000_000.0);

                log.warn("RATE LIMIT EXCEEDED for Key [{}] on path [{}]. Must wait [{}] seconds.",
                        clientKey, request.getRequestURI(), waitForRefillSecs);

                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.addHeader("X-Rate-Limit-Retry-After-Seconds", String.valueOf(waitForRefillSecs));

                // Use the exact ErrorResponse record used across the entire application
                ErrorResponse errorResponse = new ErrorResponse(
                        "Too Many Requests",
                        "Rate limit exceeded. Try again in " + waitForRefillSecs + " seconds.",
                        request.getRequestURI()
                );

                objectMapper.writeValue(response.getOutputStream(), errorResponse);
                return false;
            }

            response.addHeader("X-Rate-Limit-Remaining", String.valueOf(probe.getRemainingTokens()));
        }
        return true;
    }

    private String resolveClientKey(HttpServletRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof CustomUserDetails userDetails) {
            return "user:" + userDetails.getId();
        }
        return "ip:" + getClientIP(request);
    }

    private String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty()) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }
}