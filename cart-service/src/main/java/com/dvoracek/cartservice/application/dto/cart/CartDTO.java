package com.dvoracek.cartservice.application.dto.cart;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class CartDTO {
    private Long id;
    private String username;
    private String guestId;
    private List<CartItemDTO> items;
}
