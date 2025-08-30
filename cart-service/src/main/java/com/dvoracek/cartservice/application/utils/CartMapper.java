package com.dvoracek.cartservice.application.utils;

import com.dvoracek.cartservice.application.dto.cart.CartDTO;
import com.dvoracek.cartservice.application.dto.cart.CartItemDTO;
import com.dvoracek.cartservice.application.dto.discount.ResponseDiscountDTO;
import com.dvoracek.cartservice.domain.model.Cart;
import com.dvoracek.cartservice.domain.model.CartItem;
import com.dvoracek.cartservice.domain.model.Discount;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface CartMapper {

    CartItemDTO cartItemToCartItemDTO(CartItem cartItem);

    CartDTO toDto(Cart cart);

    ResponseDiscountDTO discountToResponseDiscountDTO(Discount discount);
}
