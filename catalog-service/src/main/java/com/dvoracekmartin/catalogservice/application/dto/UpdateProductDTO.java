package com.dvoracekmartin.catalogservice.application.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

public record UpdateProductDTO(
        Long id,
        @NotNull String name,
        String description,
        @NotNull BigDecimal price,
        List<String> images,
        Long categoryId,
        String scentProfile,
        String botanicalName,
        String extractionMethod,
        String origin,
        String usageInstructions,
        Integer volumeMl,
        String warnings,
        String medicinalUse,
        Double weightGrams,
        List<String> allergens,
        List<TagDTO> tags,
        List<UploadMediaDTO> uploadMediaDTOs
) {
}
