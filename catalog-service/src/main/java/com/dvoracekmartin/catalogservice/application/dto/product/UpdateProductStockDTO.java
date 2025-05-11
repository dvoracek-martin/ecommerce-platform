package com.dvoracekmartin.catalogservice.application.dto.product;

public record UpdateProductStockDTO(
        Long productId,
        Integer stock) {
}
