package com.dvoracekmartin.userservice.domain.service;

import com.dvoracekmartin.userservice.domain.service.UserActivationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class InMemoryUserActivationService implements UserActivationService {

    private final Map<String, TokenInfo> tokenStore = new ConcurrentHashMap<>();
    private static final long EXPIRATION_HOURS = 24;

    private static class TokenInfo {
        String email;
        LocalDateTime expirationTime;

        TokenInfo(String email, LocalDateTime expirationTime) {
            this.email = email;
            this.expirationTime = expirationTime;
        }
    }

    @Override
    public String generateActivationToken(String email) {
        String token = UUID.randomUUID().toString();
        LocalDateTime expirationTime = LocalDateTime.now().plusHours(EXPIRATION_HOURS);
        tokenStore.put(token, new TokenInfo(email, expirationTime));
        log.info("Generated activation token for email: {}, token: {}, expires: {}", email, token, expirationTime);
        return token;
    }

    @Override
    public String getEmailByToken(String token) {
        TokenInfo tokenInfo = tokenStore.get(token);
        if (tokenInfo != null) {
            log.info("Token found for: {}, email: {}, expires: {}, current time: {}",
                    token, tokenInfo.email, tokenInfo.expirationTime, LocalDateTime.now());
            if (tokenInfo.expirationTime.isAfter(LocalDateTime.now())) {
                return tokenInfo.email;
            } else {
                log.warn("Token expired: {}", token);
            }
        } else {
            log.warn("Token not found in store: {}", token);
        }
        return null;
    }

    @Override
    public boolean isTokenValid(String token) {
        TokenInfo tokenInfo = tokenStore.get(token);
        if (tokenInfo != null) {
            boolean isValid = tokenInfo.expirationTime.isAfter(LocalDateTime.now());
            log.info("Token validation for {}: {}", token, isValid);
            return isValid;
        }
        log.info("Token not found: {}", token);
        return false;
    }

    @Override
    public void invalidateToken(String token) {
        tokenStore.remove(token);
        log.info("Token invalidated: {}", token);
    }
}