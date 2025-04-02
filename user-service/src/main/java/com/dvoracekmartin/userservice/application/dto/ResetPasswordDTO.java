package com.dvoracekmartin.userservice.application.dto;

public record ResetPasswordDTO(
        String token,
        String newPassword
) {
}
