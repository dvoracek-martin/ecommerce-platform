package com.dvoracek.cartservice.application.dto.cart;

import com.dvoracek.cartservice.domain.model.cart.CartItemType;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class CartItemDTO {
    private Long itemId;
    private CartItemType cartItemType;
    private int quantity;
}
