package com.dvoracekmartin.catalogservice.application.dto;

public record UpdateCategoryDTO(
        String name,
        String description,
        String categoryType
) {
}
