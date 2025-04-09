package com.dvoracekmartin.inventoryservice.domain.service;

import com.dvoracekmartin.inventoryservice.domain.model.Inventory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class InventoryDomainServiceImpl implements InventoryDomainService {
    private static final int MIN_STOCK_FOR_ORDER = 5;

    @Override
    public boolean canPlaceOrder(Inventory inventoryItem) {
        // TODO
        return false;
    }
}
