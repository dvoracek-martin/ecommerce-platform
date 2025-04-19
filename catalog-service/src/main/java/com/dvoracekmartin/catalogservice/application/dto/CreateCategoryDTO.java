package com.dvoracekmartin.catalogservice.application.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record CreateCategoryDTO(
        @NotBlank String name,
        String description,
        @NotBlank String categoryType,
        List<UploadMediaDTO> uploadMediaDTOs,
        List<TagDTO> tags
) {
}
