package com.dvoracekmartin.userservice.application.dto;

import java.util.List;

public record UpdateUserDTO(
        String username,
        String email,
        List<CreateUserDTO.CredentialDTO> credentials
) {
    public record CredentialDTO(String type, String value, boolean temporary) {
    }
}
