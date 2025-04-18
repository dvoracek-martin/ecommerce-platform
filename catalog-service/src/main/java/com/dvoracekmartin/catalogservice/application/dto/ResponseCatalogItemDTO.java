package com.dvoracekmartin.catalogservice.application.dto;

import java.math.BigDecimal;
import java.util.List;

public record ResponseCatalogItemDTO(
        Long id,
        String name,
        String description,
        BigDecimal price,
        List<String> images,
        String type, // "product" or "mixture"
        List<ResponseProductDTO> productDTOs,
        List<ResponseMediaDTO> responseMediaDTOs,
        List<String> tagDTOs
        // TODO add other fields as needed
) {
}
