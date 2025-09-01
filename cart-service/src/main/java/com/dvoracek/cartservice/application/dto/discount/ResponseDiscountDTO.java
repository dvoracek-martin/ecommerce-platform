package com.dvoracek.cartservice.application.dto.discount;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ResponseDiscountDTO {
    private Long id;
    private String code;
    private Long value;
    private String type;
    private LocalDateTime validFrom;
    private LocalDateTime validTill;
    private Boolean active;
    private Long timesUsed;
}
