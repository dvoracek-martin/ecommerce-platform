package com.dvoracekmartin.inventoryservice.application.service;

import com.dvoracekmartin.common.event.ResponseProductStockEvent;
import com.dvoracekmartin.common.event.UpdateProductStockEvent;
import com.dvoracekmartin.inventoryservice.domain.model.Inventory;
import com.dvoracekmartin.inventoryservice.domain.repository.InventoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
public class InventoryServiceImpl implements InventoryService {

    private final InventoryRepository repository;

    @Override
    public ResponseProductStockEvent updateInventory(Long productId, UpdateProductStockEvent dto) {
        Inventory inventory = repository.findById(productId)
                .orElseGet(() -> new Inventory(productId, 0));
        inventory.setStock(dto.stock());
        Inventory savedInventory = repository.save(inventory);
        return new ResponseProductStockEvent(savedInventory.getProductId(), savedInventory.getStock());
    }

    @Override
    @Transactional(readOnly = true)
    public ResponseProductStockEvent getInventory(Long productId) {
        Inventory inventory = repository.findById(productId)
                .orElseGet(() -> new Inventory(productId, 0));
        return new ResponseProductStockEvent(inventory.getProductId(), inventory.getStock());
    }
}
