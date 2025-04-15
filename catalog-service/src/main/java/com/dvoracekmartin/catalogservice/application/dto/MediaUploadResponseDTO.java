package com.dvoracekmartin.catalogservice.application.dto;

public record MediaUploadResponseDTO(
        String status,
        String url,
        String message
) {
}
