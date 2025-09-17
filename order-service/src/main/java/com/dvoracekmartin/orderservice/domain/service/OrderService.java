package com.dvoracekmartin.orderservice.domain.service;

import com.dvoracekmartin.orderservice.application.dto.OrderRequestDTO;
import com.dvoracekmartin.orderservice.application.dto.OrderResponseDTO;
import com.dvoracekmartin.orderservice.application.dto.UpdateOrderDTO;
import com.dvoracekmartin.orderservice.application.utils.PdfDataWrapper;
import jakarta.validation.Valid;

import java.util.List;

public interface OrderService {

    OrderResponseDTO createOrder(String s, OrderRequestDTO orderRequestDTO);

    OrderResponseDTO getOrderById(String s, Long id);

    List<OrderResponseDTO> getOrdersByCustomerId(String username, String customerId);

    PdfDataWrapper getInvoiceByOrderId(String s, String customerId, Long orderId);

    List<OrderResponseDTO> findAll();

    OrderResponseDTO updateOrder(UpdateOrderDTO updateOrderDTO);
}
