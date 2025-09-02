package com.dvoracek.cartservice.application.utils;

import com.dvoracekmartin.common.dto.cart.CartDTO;
import com.dvoracekmartin.common.dto.cart.CartItemDTO;
import com.dvoracek.cartservice.application.dto.discount.ResponseDiscountDTO;
import com.dvoracek.cartservice.domain.model.cart.Cart;
import com.dvoracek.cartservice.domain.model.cart.CartItem;
import com.dvoracek.cartservice.domain.model.discount.Discount;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface CartMapper {

    CartItemDTO cartItemToCartItemDTO(CartItem cartItem);

    CartDTO toDto(Cart cart);

    ResponseDiscountDTO discountToResponseDiscountDTO(Discount discount);
}
