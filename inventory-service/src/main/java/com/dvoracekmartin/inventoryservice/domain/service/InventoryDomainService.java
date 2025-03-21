package com.dvoracekmartin.inventoryservice.domain.service;

import com.dvoracekmartin.inventoryservice.domain.model.InventoryItem;

public interface InventoryDomainService {
    boolean canPlaceOrder(InventoryItem inventoryItem);
}
