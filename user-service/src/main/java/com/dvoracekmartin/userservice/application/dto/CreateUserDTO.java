package com.dvoracekmartin.userservice.application.dto;

import java.util.List;

public record CreateUserDTO(
        String username,
        String email,
        List<CredentialDTO> credentials
) {
    public record CredentialDTO(String type, String value, boolean temporary) {
    }
}
