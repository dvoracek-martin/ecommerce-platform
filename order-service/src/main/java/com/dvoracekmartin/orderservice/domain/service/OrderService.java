package com.dvoracekmartin.orderservice.domain.service;

import com.dvoracekmartin.orderservice.application.dto.OrderRequest;
import com.dvoracekmartin.orderservice.application.dto.OrderResponse;
import com.dvoracekmartin.orderservice.domain.model.Order;

import java.util.List;

public interface OrderService {

    OrderResponse createOrder(String s, OrderRequest orderRequest);

    OrderResponse getOrderById(String s, Long id);

    List<OrderResponse> getOrdersByCustomerId(String username, String customerId);

    Order createOrderWithInvoice(Order order);
}
