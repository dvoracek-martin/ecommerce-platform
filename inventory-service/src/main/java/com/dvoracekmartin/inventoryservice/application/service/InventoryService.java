package com.dvoracekmartin.inventoryservice.application.service;

import com.dvoracekmartin.common.dto.ResponseProductStockDTO;
import com.dvoracekmartin.common.event.UpdateProductStockEvent;

public interface InventoryService {

    ResponseProductStockDTO updateInventory(Long productId, UpdateProductStockEvent dto);

    ResponseProductStockDTO getInventory(Long productId);
}
