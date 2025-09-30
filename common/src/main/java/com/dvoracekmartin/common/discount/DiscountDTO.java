package com.dvoracekmartin.common.discount;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;


@EqualsAndHashCode()
@Data
public class DiscountDTO {
    private Long id;
    private String code;
    private Long discountValue;
    private String type;
    private Long timesUsed;
    private LocalDateTime validTill;
    private LocalDateTime validFrom;
    private Boolean active;
}
