package com.dvoracekmartin.orderservice.application.dto;

import com.dvoracekmartin.common.dto.cart.CartItemDTO;
import com.dvoracekmartin.orderservice.application.utils.OrderStatus;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class OrderResponse {
    private Long id;
    private String customerId;
    private List<CartItemDTO> items;
    private Double shippingCost;
    private Double cartTotal;
    private Double finalTotal;
    private OrderStatus status;
    private String shippingMethod;
    private String paymentMethod;
    private LocalDateTime orderDate;
    private String trackingNumber;
    private int orderYearOrderCounter;

    public OrderResponse(Long id, String customerId, List<CartItemDTO> items, Double shippingCost, Double cartTotal, Double finalTotal, OrderStatus status, String shippingMethod, String paymentMethod, LocalDateTime orderDate, String trackingNumber, int orderYearOrderCounter) {
        this.id = id;
        this.customerId = customerId;
        this.items = items;
        this.shippingCost = shippingCost;
        this.cartTotal = cartTotal;
        this.finalTotal = finalTotal;
        this.status = status;
        this.shippingMethod = shippingMethod;
        this.paymentMethod = paymentMethod;
        this.orderDate = orderDate;
        this.trackingNumber = trackingNumber;
        this.orderYearOrderCounter = orderYearOrderCounter;
    }
}
