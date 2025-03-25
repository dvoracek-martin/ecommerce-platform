package com.dvoracekmartin.userservice.application.dto;

public record UpdateUserDTO(
        String id,
        String productCode,
        int quantity
) {
}

