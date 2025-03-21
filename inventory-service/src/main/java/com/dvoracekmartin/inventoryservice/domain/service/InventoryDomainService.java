package com.dvoracekmartin.inventoryservice.domain.service;

import com.dvoracekmartin.inventoryservice.domain.model.InventoryItem;
import org.springframework.stereotype.Service;

@Service
public class InventoryDomainService {
    private static final int MIN_STOCK_FOR_ORDER = 5;

    public boolean canPlaceOrder(InventoryItem inventoryItem) {
        return inventoryItem.getQuantity() >= MIN_STOCK_FOR_ORDER;
    }
}
