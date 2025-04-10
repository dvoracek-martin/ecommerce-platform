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
        List<ResponseCatalogItemDTO> products
        // TODO add other fields as needed
) {
}
