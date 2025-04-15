package com.dvoracekmartin.catalogservice.application.dto;

public record ResponseMediaDTO(
        String base64Data, String objectKey, String contentType
) {
}
