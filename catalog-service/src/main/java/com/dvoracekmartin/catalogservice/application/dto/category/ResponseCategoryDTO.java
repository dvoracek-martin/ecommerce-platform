package com.dvoracekmartin.catalogservice.application.dto.category;

import com.dvoracekmartin.catalogservice.application.dto.media.ResponseMediaDTO;
import com.dvoracekmartin.catalogservice.application.dto.tag.ResponseTagDTO;

import java.util.List;

public record ResponseCategoryDTO(
        Long id,
        String name,
        String description,
        List<ResponseMediaDTO> responseMediaDTOs,
        List<ResponseTagDTO> tags
) {
}
