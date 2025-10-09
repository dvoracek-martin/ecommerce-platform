package com.dvoracekmartin.userservice.application.dto;

import jakarta.validation.constraints.NotBlank;

public record ResetPasswordDTO(
        @NotBlank String token,
        @NotBlank String newPassword
) {
}