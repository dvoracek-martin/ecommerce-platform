package com.dvoracekmartin.common.dto;

import java.io.Serializable;

public record ResponseProductStockDTO(Long productId, Integer stock) implements Serializable {
}
