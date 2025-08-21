// src/main/java/com/dvoracek/cartservice/application/service/CartService.java
package com.dvoracek.cartservice.application.service;

import com.dvoracek.cartservice.domain.model.Cart;
import com.dvoracek.cartservice.domain.model.CartItem;
import com.dvoracek.cartservice.repository.CartRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;

    @Transactional
    public Cart getOrCreateCart(String username, String guestId) {
        if (username != null && !username.isBlank()) {
            return cartRepository.findByUsername(username)
                    .orElseGet(() -> {
                        Cart c = new Cart();
                        c.setUsername(username);
                        return cartRepository.save(c);
                    });
        }
        if (guestId != null && !guestId.isBlank()) {
            return cartRepository.findByGuestId(guestId)
                    .orElseGet(() -> {
                        Cart c = new Cart();
                        c.setGuestId(guestId);
                        return cartRepository.save(c);
                    });
        }
        // fallback – shouldn't happen - cart is created by the filter
        Cart c = new Cart();
        return cartRepository.save(c);
    }

    @Transactional
    public Cart getCart(String username, String guestId) {
        if (username != null && !username.isBlank()) {
            return cartRepository.findByUsername(username).orElseGet(Cart::new);
        }
        if (guestId != null && !guestId.isBlank()) {
            return cartRepository.findByGuestId(guestId).orElseGet(Cart::new);
        }
        return new Cart();
    }

    @Transactional
    public Cart addItem(String username, String guestId, CartItem newItem) {
        Cart cart = getOrCreateCart(username, guestId);

        Optional<CartItem> existing = cart.getItems().stream()
                .filter(item -> item.getProductId().equals(newItem.getProductId()))
                .findFirst();

        if (existing.isPresent()) {
            existing.get().setQuantity(existing.get().getQuantity() + newItem.getQuantity());
        } else {
            newItem.setCart(cart);
            cart.getItems().add(newItem);
        }

        return cartRepository.save(cart);
    }

    @Transactional
    public Cart removeItem(String username, String guestId, Long productId) {
        Cart cart = getOrCreateCart(username, guestId);
        cart.getItems().removeIf(item -> item.getProductId().equals(productId));
        return cartRepository.save(cart);
    }

    @Transactional
    public Cart updateItemQuantity(String username, String guestId, Long productId, int quantity) {
        Cart cart = getOrCreateCart(username, guestId);
        cart.getItems().stream()
                .filter(item -> item.getProductId().equals(productId))
                .findFirst()
                .ifPresent(item -> item.setQuantity(quantity));
        return cartRepository.save(cart);
    }

    @Transactional
    public Cart mergeGuestIntoUser(String username, String guestId) {
        if (username == null || username.isBlank() || guestId == null || guestId.isBlank()) {
            return getCart(username, guestId);
        }
        Cart userCart = getOrCreateCart(username, null);
        Optional<Cart> guestCartOpt = cartRepository.findByGuestId(guestId);

        if (guestCartOpt.isEmpty()) return userCart;

        Cart guestCart = guestCartOpt.get();

        guestCart.getItems().forEach(gi -> {
            Optional<CartItem> existing = userCart.getItems().stream()
                    .filter(ui -> ui.getProductId().equals(gi.getProductId()))
                    .findFirst();
            if (existing.isPresent()) {
                existing.get().setQuantity(existing.get().getQuantity() + gi.getQuantity());
            } else {
                CartItem copy = new CartItem();
                copy.setProductId(gi.getProductId());
                copy.setQuantity(gi.getQuantity());
                copy.setCart(userCart);
                userCart.getItems().add(copy);
            }
        });

        cartRepository.delete(guestCart);

        return cartRepository.save(userCart);
    }
}
