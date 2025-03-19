package com.dvoracekmartin.inventoryservice.application;

import com.dvoracekmartin.inventoryservice.domain.Inventory;
import com.dvoracekmartin.inventoryservice.domain.InventoryRepository;
import org.springframework.stereotype.Service;

@Service
public class InventoryService {
    private final InventoryRepository inventoryRepository;

    public InventoryService(InventoryRepository inventoryRepository) {
        this.inventoryRepository = inventoryRepository;
    }

    public boolean isProductAvailable(String productCode) {
        return inventoryRepository.findByProductCode(productCode)
                .map(Inventory::isAvailable)
                .orElse(false);
    }

    public void deductStock(String productCode, int quantity) {
        Inventory inventory = inventoryRepository.findByProductCode(productCode)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));
        inventory.reduceStock(quantity);
        inventoryRepository.save(inventory);
    }
}
