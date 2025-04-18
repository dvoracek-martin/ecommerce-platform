package com.dvoracekmartin.catalogservice.application.dto;

import java.math.BigDecimal;
import java.util.List;

public record ResponseMixtureDTO(
        Long id,
        String name,
        String description,
        BigDecimal price,
        List<String> images,
        List<ResponseProductDTO> products, // Nested products
        String intendedUse,
        String blendingInstructions,
        String benefits,
        String medicinalUse,
        Double totalWeightGrams,
        List<String> tagDTOs,
        boolean isCustomizable,
        String customizationOptions,
        List<ResponseMediaDTO> responseMediaDTOs
) {
}
