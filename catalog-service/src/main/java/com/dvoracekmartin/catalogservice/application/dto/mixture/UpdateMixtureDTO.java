package com.dvoracekmartin.catalogservice.application.dto.mixture;

import com.dvoracekmartin.catalogservice.application.dto.media.UploadMediaDTO;

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
        List<Long> tagIds,
        boolean isCustomizable,
        String customizationOptions,
        List<UploadMediaDTO> uploadMediaDTOs
) {
}
