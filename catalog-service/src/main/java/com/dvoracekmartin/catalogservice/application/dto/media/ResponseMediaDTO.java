package com.dvoracekmartin.catalogservice.application.dto.media;

public record ResponseMediaDTO(
        String base64Data, String objectKey, String contentType
) {
}
