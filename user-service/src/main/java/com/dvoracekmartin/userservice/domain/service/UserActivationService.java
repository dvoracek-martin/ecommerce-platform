package com.dvoracekmartin.userservice.domain.service;

public interface UserActivationService {
    String generateActivationToken(String email);
    String getEmailByToken(String token);
    boolean isTokenValid(String token);
    void invalidateToken(String token);
}