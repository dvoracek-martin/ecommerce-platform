package com.dvoracekmartin.catalogservice.application.dto.media;

public record UploadMediaDTO(
        String base64Data, String objectKey, String contentType
) {
}
