package com.dvoracekmartin.common.dto.cart;

import com.dvoracekmartin.common.discount.DiscountDTO;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

@EqualsAndHashCode()
@Data
public class CartDTO {
    private Long id;
    private String username;
    private String guestId;
    private List<CartItemDTO> items;
    private DiscountDTO discount;
}
