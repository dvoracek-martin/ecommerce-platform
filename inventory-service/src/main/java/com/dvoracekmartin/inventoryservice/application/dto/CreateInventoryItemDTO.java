package com.dvoracekmartin.inventoryservice.application.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateInventoryItemDTO {
    private String productCode;
    private int quantity;
}
