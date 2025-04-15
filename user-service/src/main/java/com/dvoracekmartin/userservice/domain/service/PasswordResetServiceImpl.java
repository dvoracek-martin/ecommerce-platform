package com.dvoracekmartin.userservice.domain.service;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
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

    private final Map<String, TokenInfo> tokenStore = new ConcurrentHashMap<>();

    @Override
    public String generateResetToken(String email) {
        String token = UUID.randomUUID().toString();
        Instant expiry = Instant.now().plus(Duration.ofHours(1));
        tokenStore.put(token, new TokenInfo(email, expiry));
        return token;
    }

    @Override
    public boolean isTokenValid(String token) {
        TokenInfo info = tokenStore.get(token);
        if (info == null || Instant.now().isAfter(info.getExpiry())) {
            tokenStore.remove(token);
            return false;
        }
        return true;
    }

    @Override
    public String getEmailByToken(String token) {
        TokenInfo info = tokenStore.get(token);
        return info != null ? info.getEmail() : null;
    }

    @Override
    public void invalidateToken(String token) {
        tokenStore.remove(token);
    }

    @Getter
    @RequiredArgsConstructor
    private static class TokenInfo {
        private final String email;
        private final Instant expiry;
    }
}
