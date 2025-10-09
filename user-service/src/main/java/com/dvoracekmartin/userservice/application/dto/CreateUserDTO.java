package com.dvoracekmartin.userservice.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record CreateUserDTO(
        @NotBlank String username,
        @NotBlank String email,
        @NotEmpty List<CredentialDTO> credentials,
        Integer preferredLanguageId,
        boolean active
) {
    public record CredentialDTO(String type, String value, boolean temporary) {
    }
}