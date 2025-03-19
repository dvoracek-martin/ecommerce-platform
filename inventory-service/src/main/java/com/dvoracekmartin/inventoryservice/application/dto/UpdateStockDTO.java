package com.dvoracekmartin.inventoryservice.application.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateStockDTO {
    private String productCode;
    private int quantity;
}
