package com.dvoracekmartin.catalogservice.application.dto.media;

public record MediaUploadResponseDTO(
        String status,
        String url,
        String message
) {
}
