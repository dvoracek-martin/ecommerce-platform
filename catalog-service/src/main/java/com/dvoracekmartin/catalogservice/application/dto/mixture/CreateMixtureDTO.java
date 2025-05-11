package com.dvoracekmartin.catalogservice.application.dto.mixture;

import com.dvoracekmartin.catalogservice.application.dto.media.UploadMediaDTO;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

public record CreateMixtureDTO(
        @NotBlank String name,
        String description,
        @NotNull BigDecimal price,
        List<String> images,
        List<Long> productIds, // List of product IDs that make up the mixture
        @NotBlank String intendedUse,
        @NotBlank String blendingInstructions,
        @NotBlank String benefits,
        String medicinalUse,
        @NotNull Double totalWeightGrams,
        List<Long> tagIds,
        boolean isCustomizable,
        String customizationOptions,
        List<UploadMediaDTO> uploadMediaDTOs
) {
}
