package com.dvoracekmartin.inventoryservice.application.service;

import com.dvoracekmartin.common.dto.ResponseProductStockDTO;
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
    public ResponseProductStockDTO updateInventory(Long productId, UpdateProductStockEvent dto) {
        Inventory inventory = repository.findById(productId)
                .orElseGet(() -> new Inventory(productId, 0));
        inventory.setStock(dto.stock());
        Inventory savedInventory = repository.save(inventory);
        return new ResponseProductStockDTO(savedInventory.getProductId(), savedInventory.getStock());
    }

    @Override
    @Transactional(readOnly = true)
    public ResponseProductStockDTO getInventory(Long productId) {
        Inventory inventory = repository.findById(productId)
                .orElseGet(() -> new Inventory(productId, 0));
        return new ResponseProductStockDTO(inventory.getProductId(), inventory.getStock());
    }
}
