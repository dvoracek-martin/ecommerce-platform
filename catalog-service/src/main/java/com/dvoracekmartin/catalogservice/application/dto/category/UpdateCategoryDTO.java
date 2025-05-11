package com.dvoracekmartin.catalogservice.application.dto.category;

import com.dvoracekmartin.catalogservice.application.dto.media.UploadMediaDTO;

import java.util.List;

public record UpdateCategoryDTO(
        Long id,
        String name,
        String description,
        String categoryType,
        List<UploadMediaDTO> uploadMediaDTOs,
        List<Long> tagIds
) {
}
