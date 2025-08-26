package com.dvoracek.cartservice.application.service;

import com.dvoracek.cartservice.application.dto.cart.CartDTO;
import com.dvoracek.cartservice.application.utils.CartMapper;
import com.dvoracek.cartservice.domain.model.Cart;
import com.dvoracek.cartservice.domain.model.CartItem;
import com.dvoracek.cartservice.repository.CartRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final CartMapper cartMapper;

    @Override
    @Transactional
    public CartDTO getCart(String username, String guestId) {
        Cart cart = getOrCreateCart(username, guestId);
        return cartMapper.toDto(cart);
    }

    @Override
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
        // Fallback for cases with neither a username nor a guestId
        Cart c = new Cart();
        return cartRepository.save(c);
    }

    @Override
    @Transactional
    public CartDTO addItem(String username, String guestId, CartItem newItem) {
        Cart cart = getOrCreateCart(username, guestId);

        Optional<CartItem> existing = cart.getItems().stream()
                .filter(item -> item.getItemId().equals(newItem.getItemId()))
                .findFirst();

        if (existing.isPresent()) {
            existing.get().setQuantity(existing.get().getQuantity() + newItem.getQuantity());
        } else {
            newItem.setCart(cart);
            cart.getItems().add(newItem);
        }

        Cart updatedCart = cartRepository.save(cart);
        return cartMapper.toDto(updatedCart);
    }

    @Override
    @Transactional
    public CartDTO removeItem(String username, String guestId, Long getItemId) {
        Cart cart = getOrCreateCart(username, guestId);
        cart.getItems().removeIf(item -> item.getItemId().equals(getItemId));
        Cart updatedCart = cartRepository.save(cart);
        return cartMapper.toDto(updatedCart);
    }

    @Override
    @Transactional
    public CartDTO updateItemQuantity(String username, String guestId, Long getItemId, int quantity) {
        Cart cart = getOrCreateCart(username, guestId);
        cart.getItems().stream()
                .filter(item -> item.getItemId().equals(getItemId))
                .findFirst()
                .ifPresent(item -> item.setQuantity(quantity));
        Cart updatedCart = cartRepository.save(cart);
        return cartMapper.toDto(updatedCart);
    }

    @Override
    @Transactional
    public CartDTO mergeGuestIntoUser(String username, String guestId) {
        if (username == null || username.isBlank() || guestId == null || guestId.isBlank()) {
            return cartMapper.toDto(getOrCreateCart(username, guestId));
        }
        Cart userCart = getOrCreateCart(username, null);
        Optional<Cart> guestCartOpt = cartRepository.findByGuestId(guestId);

        if (guestCartOpt.isEmpty()) {
            return cartMapper.toDto(userCart);
        }

        Cart guestCart = guestCartOpt.get();

        guestCart.getItems().forEach(gi -> {
            Optional<CartItem> existing = userCart.getItems().stream()
                    .filter(ui -> ui.getItemId().equals(gi.getItemId()))
                    .findFirst();
            if (existing.isPresent()) {
                existing.get().setQuantity(existing.get().getQuantity() + gi.getQuantity());
            } else {
                CartItem copy = new CartItem();
                copy.setItemId(gi.getItemId());
                copy.setQuantity(gi.getQuantity());
                copy.setItemType(gi.getItemType());
                copy.setCart(userCart);
                userCart.getItems().add(copy);
            }
        });

        cartRepository.delete(guestCart);

        Cart updatedCart = cartRepository.save(userCart);
        return cartMapper.toDto(updatedCart);
    }
}
