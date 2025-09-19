package com.dvoracekmartin.userservice.application.dto;

public record ResponseUserDTO(
        String id,
        String username,
        String email,
        int statusCode,
        boolean active
) {
}
