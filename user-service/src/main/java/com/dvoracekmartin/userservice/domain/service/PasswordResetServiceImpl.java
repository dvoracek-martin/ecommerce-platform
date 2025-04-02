package com.dvoracekmartin.userservice.domain.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Transactional
public class PasswordResetServiceImpl implements PasswordResetService {
    // In-memory token store: token -> (email, expiry)
    private Map<String, TokenInfo> tokenStore = new ConcurrentHashMap<>();

    public String generateResetToken(String email) {
        String token = UUID.randomUUID().toString();
        // Token expires in 1 hour
        Instant expiry = Instant.now().plus(Duration.ofHours(1));
        tokenStore.put(token, new TokenInfo(email, expiry));
        return token;
    }

    public boolean isTokenValid(String token) {
        TokenInfo info = tokenStore.get(token);
        if (info == null || Instant.now().isAfter(info.getExpiry())) {
            tokenStore.remove(token);
            return false;
        }
        return true;
    }

    public String getEmailByToken(String token) {
        TokenInfo info = tokenStore.get(token);
        return info != null ? info.getEmail() : null;
    }

    public void invalidateToken(String token) {
        tokenStore.remove(token);
    }

    // Inner class for token details
    private static class TokenInfo {
        private final String email;
        private final Instant expiry;

        public TokenInfo(String email, Instant expiry) {
            this.email = email;
            this.expiry = expiry;
        }

        public String getEmail() {
            return email;
        }

        public Instant getExpiry() {
            return expiry;
        }
    }
}
