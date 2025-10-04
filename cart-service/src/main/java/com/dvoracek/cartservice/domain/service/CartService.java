package com.dvoracek.cartservice.domain.service;

import com.dvoracekmartin.common.dto.cart.CartDTO;
import com.dvoracek.cartservice.application.dto.discount.CreateDiscountDTO;
import com.dvoracek.cartservice.application.dto.discount.ResponseDiscountDTO;
import com.dvoracek.cartservice.application.dto.discount.DiscountApplicationResultDTO;
import com.dvoracek.cartservice.domain.model.cart.Cart;
import com.dvoracek.cartservice.domain.model.cart.CartItem;
import com.dvoracekmartin.common.dto.cart.CartItemType;

public interface CartService {
    CartDTO getCart(String username, String guestId);

    Cart getOrCreateCart(String username, String guestId);

    CartDTO addItem(String username, String guestId, CartItem newItem);

    CartDTO removeItem(String username, String guestId, Long getItemId);

    CartDTO updateItemQuantity(String username, String guestId, Long getItemId, CartItemType cartItemType, int quantity);

    CartDTO mergeGuestIntoUser(String username, CartItem[] guestId);

    DiscountApplicationResultDTO applyDiscount(String username, String guestId, String discountCode);

    CartDTO removeDiscount(String username, String guestId);

    ResponseDiscountDTO createDiscount(CreateDiscountDTO createDiscountDTO);

    CartDTO clearCart(String s, String guestId);
}
