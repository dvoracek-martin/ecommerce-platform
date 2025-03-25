package com.dvoracekmartin.userservice.application.dto;

public record ResponseUserDTO(
        String username,
        String email,
        String firstName,
        String lastName,
        int statusCode
) {
}
