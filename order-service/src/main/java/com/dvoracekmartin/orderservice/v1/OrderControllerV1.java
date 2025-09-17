package com.dvoracekmartin.orderservice.v1;

import com.dvoracekmartin.orderservice.application.dto.OrderRequestDTO;
import com.dvoracekmartin.orderservice.application.dto.OrderResponseDTO;
import com.dvoracekmartin.orderservice.application.utils.PdfDataWrapper;
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
    public ResponseEntity<OrderResponseDTO> createOrder(@AuthenticationPrincipal Jwt jwt,
                                                        @RequestBody OrderRequestDTO orderRequestDTO) {
        OrderResponseDTO orderResponse = orderService.createOrder(usernameOrNull(jwt), orderRequestDTO);
        return ResponseEntity.ok(orderResponse);
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponseDTO> getOrderById(@AuthenticationPrincipal Jwt jwt,
                                                         @PathVariable Long id) {
        OrderResponseDTO orderResponseDTO = orderService.getOrderById(usernameOrNull(jwt), id);
        return ResponseEntity.ok(orderResponseDTO);
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<OrderResponseDTO>> getOrdersByCustomer(@AuthenticationPrincipal Jwt jwt,
                                                                      @PathVariable String customerId) {
        List<OrderResponseDTO> orders = orderService.getOrdersByCustomerId(usernameOrNull(jwt), customerId);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/customer/{customerId}/invoice/{orderId}")
    public ResponseEntity<byte[]> getInvoiceByOrderId(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String customerId,
            @PathVariable Long orderId) {

        PdfDataWrapper pdfWrapper = orderService.getInvoiceByOrderId(usernameOrNull(jwt), customerId, orderId);

        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"" + pdfWrapper.filename() + ".pdf\"")
                .contentType(org.springframework.http.MediaType.APPLICATION_PDF)
                .body(pdfWrapper.data());
    }
}
