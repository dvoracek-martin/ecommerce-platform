package com.dvoracekmartin.inventoryservice.application.service;

import com.dvoracekmartin.inventoryservice.application.dto.InventoryResponseDTO;
import com.dvoracekmartin.inventoryservice.application.dto.UpdateStockDTO;

import java.util.List;

public interface InventoryService {
    List<InventoryResponseDTO> getAllItems();

    InventoryResponseDTO getInventoryItemByProductCode(String productCode);

    void addInventoryItem(UpdateStockDTO updateStockDTO);

    void deductInventoryItem(UpdateStockDTO updateStockDTO);

    void deleteInventoryItem(String productCode);

    InventoryResponseDTO checkInventoryItemAvailability(String productCode);
}
