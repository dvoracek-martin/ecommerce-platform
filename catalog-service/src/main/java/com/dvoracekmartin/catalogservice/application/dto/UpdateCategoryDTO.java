package com.dvoracekmartin.catalogservice.application.dto;

import java.util.List;

public record UpdateCategoryDTO(
        Long id,
        String name,
        String description,
        String categoryType,
        List<UploadMediaDTO> uploadMediaDTOs
) {
}
