package com.dvoracekmartin.catalogservice.application.dto;

public record UpdateProductStockDTO(
        Long productId,
        Integer stock) {
}
