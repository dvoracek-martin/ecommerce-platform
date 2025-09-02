package com.dvoracekmartin.orderservice.application.dto;

import lombok.Data;

@Data
public class OrderItemResponse {
    private Long id;
    private Long itemId;
    private String itemType;
    private Integer quantity;
}
