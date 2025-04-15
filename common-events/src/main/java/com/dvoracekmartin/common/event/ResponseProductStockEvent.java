package com.dvoracekmartin.common.event;

import java.io.Serializable;

public record ResponseProductStockEvent(Long productId, Integer stock) implements Serializable {
}
