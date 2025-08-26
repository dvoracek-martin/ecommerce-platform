package com.dvoracek.cartservice.application.service;

import com.dvoracek.cartservice.application.dto.cart.CartDTO;
import com.dvoracek.cartservice.domain.model.Cart;
import com.dvoracek.cartservice.domain.model.CartItem;

public interface CartService {
    CartDTO getCart(String username, String guestId);
    Cart getOrCreateCart(String username, String guestId);
    CartDTO addItem(String username, String guestId, CartItem newItem);
    CartDTO removeItem(String username, String guestId, Long getItemId);
    CartDTO updateItemQuantity(String username, String guestId, Long getItemId, int quantity);
    CartDTO mergeGuestIntoUser(String username, String guestId);
}
