package com.dvoracekmartin.inventoryservice.application.service;

import com.dvoracekmartin.inventoryservice.application.dto.CreateInventoryItemDTO;
import com.dvoracekmartin.inventoryservice.application.dto.ResponseInventoryItemDTO;
import com.dvoracekmartin.inventoryservice.application.dto.UpdateInventoryItemDTO;

import java.util.List;

public interface InventoryService {

    List<ResponseInventoryItemDTO> getAllInvetoryItem();

    ResponseInventoryItemDTO getInventoryItemByProductCode(String productCode);

    void addInventoryItem(UpdateInventoryItemDTO updateInventoryItemDTO);

    void deductInventoryItem(UpdateInventoryItemDTO updateInventoryItemDTO);

    void deleteInventoryItem(String productCode);

    boolean checkInventoryItemAvailability(String productCode);

    void createInventoryItem(CreateInventoryItemDTO createInventoryItemDTO);
}
