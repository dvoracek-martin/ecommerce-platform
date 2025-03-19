package com.dvoracekmartin.inventoryservice.infrastructure;

import com.dvoracekmartin.inventoryservice.domain.Inventory;
import com.dvoracekmartin.inventoryservice.domain.InventoryRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface JpaInventoryRepository extends JpaRepository<Inventory, Long>, InventoryRepository {
    Optional<Inventory> findByProductCode(String productCode);
}
