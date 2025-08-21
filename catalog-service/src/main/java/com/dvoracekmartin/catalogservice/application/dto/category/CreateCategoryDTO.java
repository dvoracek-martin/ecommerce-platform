package com.dvoracekmartin.catalogservice.application.dto.category;

import com.dvoracekmartin.catalogservice.application.dto.media.UploadMediaDTO;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

import java.util.List;

/**
 * DTO for creating a new category.
 *
 * @param name            the name of the category
 * @param description     the description of the category
 * @param tagIds          the IDs of the tags associated with the category
 * @param uploadMediaDTOs the media associated with the category
 */
public record CreateCategoryDTO(
        @NotBlank
        String name,
        String description,
        int priority,
        @JsonProperty("active")
        boolean isActive,
        List<Long> tagIds,
        List<UploadMediaDTO> uploadMediaDTOs
) {
}
