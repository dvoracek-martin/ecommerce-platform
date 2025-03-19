package com.dvoracekmartin.inventoryservice.domain.repository;

import com.dvoracekmartin.inventoryservice.domain.model.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface InventoryRepository extends JpaRepository<InventoryItem, Long> {
    Optional<InventoryItem> findByProductCode(String productCode);
}
