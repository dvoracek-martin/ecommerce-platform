package com.dvoracekmartin.catalogservice.application.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateCategoryDTO(
        @NotBlank String name,
        String description,
        @NotBlank String categoryType
) {
}
