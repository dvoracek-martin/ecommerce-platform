package com.dvoracekmartin.inventoryservice.domain.service;

import com.dvoracekmartin.inventoryservice.domain.model.Inventory;

public interface InventoryDomainService {
    boolean canPlaceOrder(Inventory inventoryItem);
}
