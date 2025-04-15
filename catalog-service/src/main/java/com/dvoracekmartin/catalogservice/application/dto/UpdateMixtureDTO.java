package com.dvoracekmartin.catalogservice.application.dto;

import java.math.BigDecimal;
import java.util.List;

public record UpdateMixtureDTO(
        Long id,
        String name,
        String description,
        BigDecimal price,
        List<String> images,
        List<Long> productIds,
        String intendedUse,
        String blendingInstructions,
        String benefits,
        String medicinalUse,
        Double totalWeightGrams,
        List<String> tags,
        boolean isCustomizable,
        String customizationOptions,
        List<UploadMediaDTO> uploadMediaDTOs
) {
}
