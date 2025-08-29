package com.dvoracek.cartservice.web.controller.v1;

import com.dvoracek.cartservice.application.dto.cart.CartDTO;
import com.dvoracek.cartservice.application.service.CartService;
import com.dvoracek.cartservice.domain.model.CartItem;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.Nullable;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart/v1")
@RequiredArgsConstructor
public class CartControllerV1 {

    private final CartService cartService;

    private String usernameOrNull(@Nullable Jwt jwt) {
        return jwt != null ? jwt.getSubject() : null;
    }

    @GetMapping
    public ResponseEntity<CartDTO> getCart(@AuthenticationPrincipal Jwt jwt,
                                           @CookieValue(name = "gcid", required = false) String guestId) {
        return ResponseEntity.ok(cartService.getCart(usernameOrNull(jwt), guestId));
    }

    @PostMapping("/add")
    public ResponseEntity<CartDTO> addItem(@AuthenticationPrincipal Jwt jwt,
                                           @CookieValue(name = "gcid", required = false) String guestId,
                                           @RequestBody CartItem item) {
        return ResponseEntity.ok(cartService.addItem(usernameOrNull(jwt), guestId, item));
    }

    @PostMapping("/update")
    public ResponseEntity<CartDTO> updateItem(@AuthenticationPrincipal Jwt jwt,
                                              @CookieValue(name = "gcid", required = false) String guestId,
                                              @RequestParam Long itemId,
                                              @RequestParam int quantity) {
        return ResponseEntity.ok(cartService.updateItemQuantity(usernameOrNull(jwt), guestId, itemId, quantity));
    }

    @DeleteMapping("/remove/{productId}")
    public ResponseEntity<CartDTO> removeItem(@AuthenticationPrincipal Jwt jwt,
                                              @CookieValue(name = "gcid", required = false) String guestId,
                                              @PathVariable Long productId) {
        return ResponseEntity.ok(cartService.removeItem(usernameOrNull(jwt), guestId, productId));
    }

    @PostMapping("/merge")
    public ResponseEntity<CartDTO> merge(@AuthenticationPrincipal Jwt jwt,
                                         @RequestBody CartItem[] guestItems) {
        return ResponseEntity.ok(cartService.mergeGuestIntoUser(usernameOrNull(jwt), guestItems));
    }

}
