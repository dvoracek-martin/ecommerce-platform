package com.dvoracekmartin.common.dto.media;

public record MediaDTO(
        String base64Data, String objectKey, String contentType
) {
}
