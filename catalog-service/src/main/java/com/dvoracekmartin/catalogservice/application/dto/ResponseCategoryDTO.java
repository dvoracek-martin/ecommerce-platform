package com.dvoracekmartin.catalogservice.application.dto;

public record ResponseCategoryDTO(
        Long id,
        String name,
        String description,
        String categoryType
) {
}
