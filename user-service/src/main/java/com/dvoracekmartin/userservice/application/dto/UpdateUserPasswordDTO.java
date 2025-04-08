package com.dvoracekmartin.userservice.application.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateUserPasswordDTO(
        @NotBlank String currentPassword,
        @NotBlank String newPassword
) {
}
