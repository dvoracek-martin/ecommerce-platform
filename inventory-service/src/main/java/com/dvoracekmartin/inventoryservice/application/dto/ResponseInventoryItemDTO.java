package com.dvoracekmartin.inventoryservice.application.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ResponseInventoryItemDTO {
    private String productCode;
    private int quantity;
}
