package com.dvoracek.cartservice.application.dto.cart;

import com.dvoracek.cartservice.application.dto.discount.DiscountDTO;
import lombok.Data;

import java.util.List;

@Data
public class CartDTO {
    private Long id;
    private String username;
    private String guestId;
    private List<CartItemDTO> items;
    private DiscountDTO discount;
}
