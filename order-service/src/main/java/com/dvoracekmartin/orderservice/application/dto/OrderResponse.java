package com.dvoracekmartin.orderservice.application.dto;

import com.dvoracekmartin.common.dto.media.MediaDTO;
import com.dvoracekmartin.orderservice.application.utils.OrderStatus;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class OrderResponse {
    private Long id;
    private String customerId;
    private List<OrderItemResponse> items;
    private Double shippingCost;
    private Double cartTotal;
    private Double finalTotal;
    private OrderStatus status;
    private String shippingMethod;
    private String paymentMethod;
    private LocalDateTime orderDate;
    private String trackingNumber;
    private String invoiceUrl;
    private String invoiceObjectKey;
    private MediaDTO invoice;

}
