package com.dvoracek.cartservice.application.dto.discount;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;


@EqualsAndHashCode()
@Data
public class CreateDiscountDTO {
    private String code;
    private Long discountValue;
    private String type;
    private Long timesUsed;
    private LocalDateTime validTill;
    private LocalDateTime validFrom;
    private Boolean active;
}
