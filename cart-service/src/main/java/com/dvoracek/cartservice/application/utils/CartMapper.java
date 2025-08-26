package com.dvoracek.cartservice.application.utils;

import com.dvoracek.cartservice.application.dto.cart.CartDTO;
import com.dvoracek.cartservice.application.dto.cart.CartItemDTO;
import com.dvoracek.cartservice.domain.model.Cart;
import com.dvoracek.cartservice.domain.model.CartItem;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface CartMapper {
    CartDTO toDto(Cart cart);

    CartItemDTO toDto(CartItem cartItem);
}
