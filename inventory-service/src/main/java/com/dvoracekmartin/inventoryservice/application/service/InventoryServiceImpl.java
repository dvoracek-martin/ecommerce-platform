package com.dvoracekmartin.inventoryservice.application.service;

import com.dvoracekmartin.inventoryservice.application.dto.InventoryResponseDTO;
import com.dvoracekmartin.inventoryservice.application.dto.UpdateStockDTO;
import com.dvoracekmartin.inventoryservice.domain.model.InventoryItem;
import com.dvoracekmartin.inventoryservice.domain.repository.InventoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class InventoryServiceImpl implements InventoryService {

    @Autowired
    InventoryRepository inventoryRepository;

    @Override
    public List<InventoryResponseDTO> getAllItems() {
        return inventoryRepository.findAll().stream()
                .map(item -> new InventoryResponseDTO(item.getProductCode(), item.getQuantity()))
                .collect(Collectors.toList());
    }

    @Override
    public InventoryResponseDTO getInventoryItemByProductCode(String productCode) {
        InventoryItem item = inventoryRepository.findByProductCode(productCode)
                .orElseThrow(() -> new RuntimeException("Inventory item not found for product code: " + productCode));
        return new InventoryResponseDTO(item.getProductCode(), item.getQuantity());
    }

    @Override
    public void addInventoryItem(UpdateStockDTO updateStockDTO) {
        Optional<InventoryItem> existingItem = inventoryRepository.findByProductCode(updateStockDTO.getProductCode());
        if (existingItem.isPresent()) {
            InventoryItem item = existingItem.get();
            item.increaseQuantity(updateStockDTO.getQuantity());
            inventoryRepository.save(item);
        } else {
            InventoryItem newItem = new InventoryItem(updateStockDTO.getProductCode(), updateStockDTO.getQuantity());
            inventoryRepository.save(newItem);
        }
    }

    @Override
    public void deductInventoryItem(UpdateStockDTO updateStockDTO) {
        InventoryItem item = inventoryRepository.findByProductCode(updateStockDTO.getProductCode())
                .orElseThrow(() -> new RuntimeException("Inventory item not found for product code: " + updateStockDTO.getProductCode()));
        if (item.getQuantity() < updateStockDTO.getQuantity()) {
            throw new RuntimeException("Not enough stock available for product: " + updateStockDTO.getProductCode());
        }
        item.decreaseQuantity(updateStockDTO.getQuantity());
        inventoryRepository.save(item);
    }

    @Override
    public void deleteInventoryItem(String productCode) {
        InventoryItem item = inventoryRepository.findByProductCode(productCode)
                .orElseThrow(() -> new RuntimeException("Inventory item not found for product code: " + productCode));
        inventoryRepository.delete(item);
    }

    @Override
    public InventoryResponseDTO checkInventoryItemAvailability(String productCode) {
        InventoryItem item = inventoryRepository.findByProductCode(productCode)
                .orElseThrow(() -> new RuntimeException("Inventory item not found for product code: " + productCode));
        return new InventoryResponseDTO(item.getProductCode(), item.getQuantity());
    }
}
