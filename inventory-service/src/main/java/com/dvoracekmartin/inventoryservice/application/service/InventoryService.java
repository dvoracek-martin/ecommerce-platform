package com.dvoracekmartin.inventoryservice.application.service;

import com.dvoracekmartin.common.event.ResponseProductStockEvent;
import com.dvoracekmartin.common.event.UpdateProductStockEvent;

public interface InventoryService {

    ResponseProductStockEvent updateInventory(Long productId, UpdateProductStockEvent dto);

    ResponseProductStockEvent getInventory(Long productId);
}
