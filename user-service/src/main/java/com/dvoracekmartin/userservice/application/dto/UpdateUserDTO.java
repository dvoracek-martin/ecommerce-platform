package com.dvoracekmartin.userservice.application.dto;

import java.util.List;

public record UpdateUserDTO(
        String username,
        String email,
        List<CreateUserDTO.CredentialDTO> credentials
) {}
