package com.dvoracek.cartservice.application.dto.discount;

import com.dvoracekmartin.common.dto.cart.CartDTO;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode()
@Data
public class DiscountApplicationResultDTO {
    private boolean success;
    private String message;
    private CartDTO cart;
    private ResponseDiscountDTO appliedDiscount;

    public static DiscountApplicationResultDTO success(CartDTO cart, ResponseDiscountDTO discount) {
        DiscountApplicationResultDTO result = new DiscountApplicationResultDTO();
        result.setSuccess(true);
        result.setMessage("Discount applied successfully");
        result.setCart(cart);
        result.setAppliedDiscount(discount);
        return result;
    }

    public static DiscountApplicationResultDTO error(String message, CartDTO cart) {
        DiscountApplicationResultDTO result = new DiscountApplicationResultDTO();
        result.setSuccess(false);
        result.setMessage(message);
        result.setCart(cart);
        return result;
    }
}
