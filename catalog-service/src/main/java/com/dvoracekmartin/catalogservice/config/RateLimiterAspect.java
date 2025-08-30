package com.dvoracekmartin.catalogservice.config;

import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.server.ResponseStatusException;

import java.util.concurrent.TimeUnit;

@Aspect
@Component
public class RateLimiterAspect {

    private static final Logger log = LoggerFactory.getLogger(RateLimiterAspect.class);

    private final RedisTemplate<String, String> redisTemplate;

    public RateLimiterAspect(RedisTemplate<String, String> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Around("@annotation(rateLimit)")
    public Object rateLimit(ProceedingJoinPoint joinPoint, RateLimit rateLimit) throws Throwable {
        HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();

        // 1. Create a unique key based on IP and User-Agent
        String ipAddress = getClientIpAddress(request);
        String userAgent = request.getHeader("User-Agent");
        String key = "rate_limit:" + ipAddress + ":" + (userAgent != null ? userAgent.hashCode() : "unknown");

        long limit = rateLimit.limit();
        long duration = rateLimit.durationInSeconds();

        // 2. Use Redis to track requests
        Long currentCount = redisTemplate.opsForValue().increment(key);

        if (currentCount == null) {
            throw new IllegalStateException("Redis increment returned null");
        }

        // Set the expiration if this is the first increment for the key
        if (currentCount == 1) {
            redisTemplate.expire(key, duration, TimeUnit.SECONDS);
        }

        // 3. Check the limit
        if (currentCount > limit) {
            log.warn("Rate limit exceeded for key: {}", key);
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "You have exceeded the request limit. Please try again later.");
        }

        log.info("Request count for key {}: {}", key, currentCount);

        // 4. Proceed with the original method execution
        return joinPoint.proceed();
    }

    private String getClientIpAddress(HttpServletRequest request) {
        // Handle common proxy headers
        String xForwardedForHeader = request.getHeader("X-Forwarded-For");
        if (xForwardedForHeader != null && !xForwardedForHeader.isEmpty()) {
            return xForwardedForHeader.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
