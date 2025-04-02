package com.dvoracekmartin.userservice.application.dto;

public record UpdateUserPasswordDTO(
        String currentPassword,
        String newPassword
) {
}
