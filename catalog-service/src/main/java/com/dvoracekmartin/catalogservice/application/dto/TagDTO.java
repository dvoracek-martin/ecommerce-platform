package com.dvoracekmartin.catalogservice.application.dto;

public record TagDTO(
        Long id,
        String name,
        String description,
        String color,
        String icon,
        String imageUrl
) {
}
