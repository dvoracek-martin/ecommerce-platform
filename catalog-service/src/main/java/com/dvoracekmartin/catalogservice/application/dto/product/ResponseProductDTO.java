package com.dvoracekmartin.catalogservice.application.dto.product;

import com.dvoracekmartin.catalogservice.application.dto.media.MediaDTO;
import com.dvoracekmartin.catalogservice.application.dto.tag.ResponseTagDTO;

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
        List<ResponseTagDTO> tagsDTOs,
        List<MediaDTO> mediaDTOS
) {
}
