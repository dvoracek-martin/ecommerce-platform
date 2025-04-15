package com.dvoracekmartin.catalogservice.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

public record CreateProductDTO(
        @NotBlank String name,
        String description,
        @NotNull BigDecimal price,
        List<String> images,
        @NotNull Long categoryId,
        @NotBlank String scentProfile,
        @NotBlank String botanicalName,
        @NotBlank String extractionMethod,
        @NotBlank String origin,
        @NotBlank String usageInstructions,
        @NotNull Integer volumeMl,
        @NotBlank String warnings,
        String medicinalUse,
        @NotNull Double weightGrams,
        List<String> allergens,
        List<String> tags
) {
}
