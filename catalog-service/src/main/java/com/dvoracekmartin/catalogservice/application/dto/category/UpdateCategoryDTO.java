package com.dvoracekmartin.catalogservice.application.dto.category;

import com.dvoracekmartin.catalogservice.application.dto.media.UploadMediaDTO;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record UpdateCategoryDTO(
        Long id,
        String name,
        String description,
        String categoryType,
        int priority,
        @JsonProperty("active")
        boolean isActive,
        List<UploadMediaDTO> uploadMediaDTOs,
        List<Long> tagIds
) {
}
