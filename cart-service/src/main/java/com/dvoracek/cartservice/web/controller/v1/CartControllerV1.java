// src/main/java/com/dvoracek/cartservice/web/controller/v1/CartController.java
package com.dvoracek.cartservice.web.controller.v1;

import com.dvoracek.cartservice.application.service.CartService;
import com.dvoracek.cartservice.domain.model.Cart;
import com.dvoracek.cartservice.domain.model.CartItem;
import lombok.RequiredArgsConstructor;
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
    public Cart getCart(@AuthenticationPrincipal Jwt jwt,
                        @CookieValue(name = "gcid", required = false) String guestId) {
        return cartService.getCart(usernameOrNull(jwt), guestId);
    }

    @PostMapping("/add")
    public Cart addItem(@AuthenticationPrincipal Jwt jwt,
                        @CookieValue(name = "gcid", required = false) String guestId,
                        @RequestBody CartItem item) {
        return cartService.addItem(usernameOrNull(jwt), guestId, item);
    }

    @PostMapping("/update")
    public Cart updateItem(@AuthenticationPrincipal Jwt jwt,
                           @CookieValue(name = "gcid", required = false) String guestId,
                           @RequestParam Long productId,
                           @RequestParam int quantity) {
        return cartService.updateItemQuantity(usernameOrNull(jwt), guestId, productId, quantity);
    }

    @DeleteMapping("/remove/{productId}")
    public Cart removeItem(@AuthenticationPrincipal Jwt jwt,
                           @CookieValue(name = "gcid", required = false) String guestId,
                           @PathVariable Long productId) {
        return cartService.removeItem(usernameOrNull(jwt), guestId, productId);
    }

    @PostMapping("/merge")
    public Cart merge(@AuthenticationPrincipal Jwt jwt,
                      @CookieValue(name = "gcid", required = false) String guestId) {
        return cartService.mergeGuestIntoUser(usernameOrNull(jwt), guestId);
    }
}
