package com.dvoracekmartin.catalogservice.application.dto;

public record UploadMediaDTO(
        String base64Data, String objectKey, String contentType
) {
}
