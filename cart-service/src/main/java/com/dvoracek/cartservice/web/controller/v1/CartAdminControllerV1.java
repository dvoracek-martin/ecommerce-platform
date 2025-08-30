package com.dvoracek.cartservice.web.controller.v1;

import com.dvoracek.cartservice.application.dto.discount.CreateDiscountDTO;
import com.dvoracek.cartservice.application.dto.discount.ResponseDiscountDTO;
import com.dvoracek.cartservice.application.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.Nullable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/cart/v1/admin")
@PreAuthorize("hasRole('user_admin')")
@Validated
@RequiredArgsConstructor
public class CartAdminControllerV1 {

    private final CartService cartService;

    private String usernameOrNull(@Nullable Jwt jwt) {
        return jwt != null ? jwt.getSubject() : null;
    }

    @PostMapping()
    public ResponseEntity<ResponseDiscountDTO> createDiscount(@RequestBody CreateDiscountDTO createDiscountDTO) {
        ResponseDiscountDTO responseDiscountDTO = cartService.createDiscount(createDiscountDTO);
        return ResponseEntity.ok(responseDiscountDTO);
    }
}
