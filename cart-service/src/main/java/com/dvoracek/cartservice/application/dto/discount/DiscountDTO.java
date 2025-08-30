package com.dvoracek.cartservice.application.dto.discount;

import lombok.Data;



@Data
public class DiscountDTO {
    private Long id;
    private String code;
    private Long discountValue;
    private String type;
}
