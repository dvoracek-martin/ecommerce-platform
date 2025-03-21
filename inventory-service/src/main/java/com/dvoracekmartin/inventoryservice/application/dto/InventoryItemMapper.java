package com.dvoracekmartin.inventoryservice.application.dto;

import com.dvoracekmartin.inventoryservice.domain.model.InventoryItem;

public class InventoryItemMapper {

    public static InventoryItem toDomain(UpdateInventoryItemDTO dto) {
        return InventoryItem.InventoryItemBuilder()
//                .id(dto.getId())
                .productCode(dto.getProductCode())
                .quantity(dto.getQuantity())
                .build();
    }
}
