package com.dvoracekmartin.userservice.application.dto;

import jakarta.validation.constraints.NotBlank;

public record ForgotPasswordDTO(
        @NotBlank String email
) {
}
