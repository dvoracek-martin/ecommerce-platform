package com.dvoracek.cartservice.application.dto.discount;

import lombok.Data;



@Data
public class CreateDiscountDTO {
    private String code;
    private Long value;
    private String type;
}
