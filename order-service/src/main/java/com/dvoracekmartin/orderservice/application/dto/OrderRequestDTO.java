package com.dvoracekmartin.orderservice.application.dto;

import com.dvoracekmartin.common.dto.cart.CartItemDTO;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

@EqualsAndHashCode()
@Data
public class OrderRequestDTO {
    private String customerId;
    private List<CartItemDTO> items;
    private Double shippingCost;
    private Double cartTotal;
    private Double finalTotal;
    private String shippingMethod;
    private String paymentMethod;
}
