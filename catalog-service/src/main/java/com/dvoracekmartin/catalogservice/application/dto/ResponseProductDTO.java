package com.dvoracekmartin.catalogservice.application.dto;

import java.math.BigDecimal;
import java.util.List;

public record ResponseProductDTO(
        Long id,
        String name,
        String description,
        BigDecimal price,
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
        List<String> tags
) {
}
