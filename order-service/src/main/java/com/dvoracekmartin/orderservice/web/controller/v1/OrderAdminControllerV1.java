package com.dvoracekmartin.orderservice.web.controller.v1;

import com.dvoracekmartin.orderservice.application.dto.OrderResponseDTO;
import com.dvoracekmartin.orderservice.application.dto.UpdateOrderDTO;
import com.dvoracekmartin.orderservice.domain.service.OrderService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders/v1/admin")
@PreAuthorize("hasRole('user_admin')")
@Validated
@AllArgsConstructor
public class OrderAdminControllerV1 {

    private final OrderService orderService;

    @GetMapping
    public ResponseEntity<List<OrderResponseDTO>> getAllOrders() {
        return ResponseEntity.ok(orderService.findAll());
    }

    @PutMapping
    public ResponseEntity<OrderResponseDTO> updateOrder(@Valid @RequestBody UpdateOrderDTO updateOrderDTO) {
        return ResponseEntity.ok(orderService.updateOrder(updateOrderDTO));
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<OrderResponseDTO>> getOrdersByCustomer(@AuthenticationPrincipal Jwt jwt, @PathVariable String customerId) {
        List<OrderResponseDTO> orders = orderService.getOrdersByCustomerIdAdmin(customerId);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/{orderId}/{selectedLocale}")
    public ResponseEntity<byte[]> generateInvoiceInLocale(@AuthenticationPrincipal Jwt jwt, @PathVariable String orderId, @PathVariable String selectedLocale) {
        return ResponseEntity.ok(orderService.generateInvoice(orderId, selectedLocale));
    }
}
