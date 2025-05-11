package com.dvoracekmartin.catalogservice.application.dto.category;

import com.dvoracekmartin.catalogservice.application.dto.media.ResponseMediaDTO;
import com.dvoracekmartin.catalogservice.application.dto.product.ResponseProductDTO;

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
        List<Long> tagIds
        // TODO add other fields as needed
) {
}
