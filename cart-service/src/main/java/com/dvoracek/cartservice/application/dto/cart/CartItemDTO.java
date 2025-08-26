package com.dvoracek.cartservice.application.dto.cart;

import com.dvoracek.cartservice.domain.model.CartItemType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class CartItemDTO {
    private Long itemId;
    private CartItemType itemType;
    private int quantity;
}
