package com.dvoracekmartin.catalogservice.application.dto.media;

public record MediaDTO(
        String base64Data, String objectKey, String contentType
) {
}
