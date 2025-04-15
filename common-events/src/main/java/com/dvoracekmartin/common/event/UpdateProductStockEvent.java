package com.dvoracekmartin.common.event;

public record UpdateProductStockEvent(
        Long productId,
        Integer stock
) {
}
