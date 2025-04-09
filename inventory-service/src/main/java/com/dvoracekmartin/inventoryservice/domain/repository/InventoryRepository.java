package com.dvoracekmartin.inventoryservice.domain.repository;

import com.dvoracekmartin.inventoryservice.domain.model.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface InventoryRepository extends JpaRepository<Inventory, Long> {
    Optional<Inventory> findByProductId(Long productId);
}
