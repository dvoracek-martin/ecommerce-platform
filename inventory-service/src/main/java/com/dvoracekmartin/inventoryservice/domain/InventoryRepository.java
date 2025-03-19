package com.dvoracekmartin.inventoryservice.domain;

import java.util.Optional;

public interface InventoryRepository {
    Optional<Inventory> findByProductCode(String productCode);
    Inventory save(Inventory inventory);
}
