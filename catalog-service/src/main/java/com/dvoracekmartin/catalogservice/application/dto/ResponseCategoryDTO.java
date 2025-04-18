package com.dvoracekmartin.catalogservice.application.dto;

import java.util.List;

public record ResponseCategoryDTO(
        Long id,
        String name,
        String description,
        String categoryType,
        List<ResponseMediaDTO> responseMediaDTOs,
        List<String> tagDTOs
) {
}
