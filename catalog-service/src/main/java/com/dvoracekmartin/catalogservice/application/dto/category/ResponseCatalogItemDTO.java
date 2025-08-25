package com.dvoracekmartin.catalogservice.application.dto.category;

import com.dvoracekmartin.catalogservice.application.dto.media.MediaDTO;
import com.dvoracekmartin.catalogservice.application.dto.product.ResponseProductDTO;

import java.math.BigDecimal;
import java.util.List;

// TODO either change to an interface which both product and mixture can implement,
// or create a common record for product and mixture, or use a type field to distinguish them
public record ResponseCatalogItemDTO(
        Long id,
        String name,
        String description,
        BigDecimal price,
        List<String> images,
        String type, // "product" or "mixture"
        List<ResponseProductDTO> productDTOs,
        List<MediaDTO> mediaDTOS,
        List<Long> tagIds
        // TODO add other fields as needed
) {
}
