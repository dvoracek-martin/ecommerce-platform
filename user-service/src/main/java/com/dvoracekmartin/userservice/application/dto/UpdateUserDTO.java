package com.dvoracekmartin.userservice.application.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record UpdateUserDTO(
        String id,
        @NotBlank String username,
        @NotBlank String email,
        List<CreateUserDTO.CredentialDTO> credentials,
        Integer preferredLanguageId,
        boolean active
) {
}
