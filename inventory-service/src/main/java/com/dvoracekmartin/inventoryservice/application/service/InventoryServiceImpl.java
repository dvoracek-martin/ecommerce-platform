package com.dvoracekmartin.inventoryservice.application.service;

import com.dvoracekmartin.inventoryservice.application.dto.CreateInventoryItemDTO;
import com.dvoracekmartin.inventoryservice.application.dto.ResponseInventoryItemDTO;
import com.dvoracekmartin.inventoryservice.application.dto.UpdateInventoryItemDTO;
import com.dvoracekmartin.inventoryservice.domain.model.InventoryItem;
import com.dvoracekmartin.inventoryservice.domain.repository.InventoryRepository;
import com.dvoracekmartin.inventoryservice.domain.service.InventoryDomainService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class InventoryServiceImpl implements InventoryService {

    private final InventoryDomainService inventoryDomainService;
    private final InventoryRepository inventoryRepository;

    public InventoryServiceImpl(InventoryDomainService inventoryDomainService, InventoryRepository inventoryRepository) {
        this.inventoryDomainService = inventoryDomainService;
        this.inventoryRepository = inventoryRepository;
    }

    @Override
    public List<ResponseInventoryItemDTO> getAllInvetoryItem() {
        return inventoryRepository.findAll().stream()
                .map(item -> new ResponseInventoryItemDTO(item.getProductCode(), item.getQuantity()))
                .collect(Collectors.toList());
    }

    @Override
    public ResponseInventoryItemDTO getInventoryItemByProductCode(String productCode) {
        InventoryItem item = inventoryRepository.findByProductCode(productCode)
                .orElseThrow(() -> new RuntimeException("Inventory item not found for product code: " + productCode));
        return new ResponseInventoryItemDTO(item.getProductCode(), item.getQuantity());
    }

    @Override
    public void addInventoryItem(UpdateInventoryItemDTO updateInventoryItemDTO) {
        Optional<InventoryItem> existingItem = inventoryRepository.findByProductCode(updateInventoryItemDTO.getProductCode());
        if (existingItem.isPresent()) {
            InventoryItem item = existingItem.get();
            item.increaseQuantity(updateInventoryItemDTO.getQuantity());
            inventoryRepository.save(item);
        } else {
            InventoryItem newItem = new InventoryItem(updateInventoryItemDTO.getProductCode(), updateInventoryItemDTO.getQuantity());
            inventoryRepository.save(newItem);
        }
    }

    @Override
    public void deductInventoryItem(UpdateInventoryItemDTO updateInventoryItemDTO) {
        InventoryItem inventoryItem = inventoryRepository.findByProductCode(updateInventoryItemDTO.getProductCode())
                .orElseThrow(() -> new RuntimeException("Inventory item not found for product code: " + updateInventoryItemDTO.getProductCode()));
        if (inventoryItem.getQuantity() < updateInventoryItemDTO.getQuantity()) {
            throw new RuntimeException("Not enough stock available for product: " + updateInventoryItemDTO.getProductCode());
        }
        inventoryItem.decreaseQuantity(updateInventoryItemDTO.getQuantity());
        inventoryRepository.save(inventoryItem);
    }

    @Override
    public void deleteInventoryItem(String productCode) {
        InventoryItem inventoryItem = inventoryRepository.findByProductCode(productCode)
                .orElseThrow(() -> new RuntimeException("Inventory item not found for product code: " + productCode));
        inventoryRepository.delete(inventoryItem);
    }

    @Override
    public boolean checkInventoryItemAvailability(String productCode) {
        InventoryItem item = inventoryRepository.findByProductCode(productCode)
                .orElseThrow(() -> new IllegalArgumentException("Item not found"));
        return inventoryDomainService.canPlaceOrder(item);
    }

    @Override
    public void createInventoryItem(CreateInventoryItemDTO createInventoryItemDTO) {
        Optional<InventoryItem> existingItem = inventoryRepository.findByProductCode(createInventoryItemDTO.getProductCode());
        if (existingItem.isPresent()) {
           // do something
        } else {
            InventoryItem newInventoryItem = InventoryItem.InventoryItemBuilder()
                    .productCode(createInventoryItemDTO.getProductCode())
                    .quantity(createInventoryItemDTO.getQuantity())
                    .build();
            inventoryRepository.save(newInventoryItem);
        }
    }
}
