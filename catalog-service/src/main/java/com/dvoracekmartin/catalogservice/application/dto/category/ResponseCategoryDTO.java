package com.dvoracekmartin.catalogservice.application.dto.category;

import com.dvoracekmartin.catalogservice.application.dto.media.ResponseMediaDTO;
import com.dvoracekmartin.catalogservice.application.dto.tag.ResponseTagDTO;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record ResponseCategoryDTO(
        Long id,
        String name,
        String description,
        int priority,
        @JsonProperty("active")
        boolean isActive,
        List<ResponseMediaDTO> responseMediaDTOs,
        List<ResponseTagDTO> tags
) {
}
