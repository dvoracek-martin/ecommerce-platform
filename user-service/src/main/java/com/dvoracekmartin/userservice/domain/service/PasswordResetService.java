package com.dvoracekmartin.userservice.domain.service;

public interface PasswordResetService {
    String generateResetToken(String email);

    boolean isTokenValid(String token);

    String getEmailByToken(String token);

    void invalidateToken(String token);
}
