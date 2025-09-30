package com.dvoracekmartin.common.dto.cart;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode()
@Data
@AllArgsConstructor
public class CartItemDTO {
    private Long itemId;
    private CartItemType cartItemType;
    private int quantity;
}
