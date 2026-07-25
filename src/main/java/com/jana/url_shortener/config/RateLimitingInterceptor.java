package com.jana.url_shortener.config;

import com.jana.url_shortener.service.RateLimitingService;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
@RequiredArgsConstructor
@Slf4j
public class RateLimitingInterceptor implements HandlerInterceptor {

    private final RateLimitingService rateLimitingService;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if ("POST".equalsIgnoreCase(request.getMethod())) {
            String clientIp = getClientIP(request);
            Bucket bucket = rateLimitingService.resolveBucket(clientIp);
            ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);

            if (!probe.isConsumed()) {
                long waitForRefillSecs = probe.getNanosToWaitForRefill() / 1_000_000_000;

                log.warn("RATE LIMIT EXCEEDED for IP [{}] on path [{}]. Must wait [{}] seconds.",
                        clientIp, request.getRequestURI(), waitForRefillSecs);

                response.addHeader("X-Rate-Limit-Retry-After-Seconds", String.valueOf(waitForRefillSecs));
                response.sendError(HttpStatus.TOO_MANY_REQUESTS.value(),
                        "Rate limit exceeded. Try again in " + waitForRefillSecs + " seconds.");
                return false;
            }

            log.debug("Rate limit token consumed for IP [{}]. Tokens remaining: [{}]",
                    clientIp, probe.getRemainingTokens());

            response.addHeader("X-Rate-Limit-Remaining", String.valueOf(probe.getRemainingTokens()));
        }
        return true;
    }

    private String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty()) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }
}