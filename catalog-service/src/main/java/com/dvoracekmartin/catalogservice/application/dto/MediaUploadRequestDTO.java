package com.dvoracekmartin.catalogservice.application.dto;

public record MediaUploadRequestDTO(
        String base64Data, String objectKey, String contentType
) {
}
