package com.dvoracekmartin.orderservice.v1;

import com.dvoracekmartin.orderservice.application.dto.OrderRequest;
import com.dvoracekmartin.orderservice.application.dto.OrderResponse;
import com.dvoracekmartin.orderservice.domain.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.Nullable;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders/v1")
@RequiredArgsConstructor
@Validated
public class OrderControllerV1 {


    private String usernameOrNull(@Nullable Jwt jwt) {
        return jwt != null ? jwt.getSubject() : null;
    }

    @Autowired
    private OrderService orderService;

    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(@AuthenticationPrincipal Jwt jwt,
                                                     @RequestBody OrderRequest orderRequest) {
        OrderResponse orderResponse = orderService.createOrder(usernameOrNull(jwt), orderRequest);
        return ResponseEntity.ok(orderResponse);
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrder(@AuthenticationPrincipal Jwt jwt,
                                                  @PathVariable Long id) {
        OrderResponse orderResponse = orderService.getOrderById(usernameOrNull(jwt), id);
        return ResponseEntity.ok(orderResponse);
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<OrderResponse>> getOrdersByCustomer(@AuthenticationPrincipal Jwt jwt,
                                                                   @PathVariable String customerId) {
        List<OrderResponse> orders = orderService.getOrdersByCustomerId(usernameOrNull(jwt), customerId);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/customer/{customerId}/invoice/{orderId}")
    public ResponseEntity<byte[]> getInvoiceByOrderId(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String customerId,
            @PathVariable Long orderId) {

        byte[] pdfData = orderService.getInvoiceByOrderId(usernameOrNull(jwt), customerId, orderId);

        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=invoice_" + orderId + ".pdf")
                .contentType(org.springframework.http.MediaType.APPLICATION_PDF)
                .body(pdfData);
    }
}
