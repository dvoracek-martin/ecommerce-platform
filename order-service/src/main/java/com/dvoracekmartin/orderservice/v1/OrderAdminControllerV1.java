package com.dvoracekmartin.orderservice.v1;

import com.dvoracekmartin.orderservice.application.dto.OrderResponse;
import com.dvoracekmartin.orderservice.domain.service.OrderService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.Nullable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/orders/v1/admin")
@PreAuthorize("hasRole('user_admin')")
@Validated
@AllArgsConstructor
public class OrderAdminControllerV1 {

    private final OrderService orderService;

    @GetMapping
    public ResponseEntity<List<OrderResponse>> getAllOrders() {
        return ResponseEntity.ok(orderService.findAll());
    }
}
