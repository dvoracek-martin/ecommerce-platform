package com.dvoracekmartin.inventoryservice.presentation.controller;

import com.dvoracekmartin.inventoryservice.application.dto.InventoryResponseDTO;
import com.dvoracekmartin.inventoryservice.application.dto.UpdateStockDTO;
import com.dvoracekmartin.inventoryservice.application.service.InventoryService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/inventory")
public class InventoryController {
    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping("/{productCode}")
    public InventoryResponseDTO checkStock(@PathVariable String productCode) {
        return inventoryService.checkInventoryItemAvailability(productCode);
    }

    @PostMapping("/add")
    public void addStock(@RequestBody UpdateStockDTO updateStockDTO) {
        inventoryService.addInventoryItem(updateStockDTO);
    }

    @PostMapping("/deduct")
    public void deductStock(@RequestBody UpdateStockDTO updateStockDTO) {
        inventoryService.deductInventoryItem(updateStockDTO);
    }

    @GetMapping("/all")
    public List<InventoryResponseDTO> getAllStock() {
        return inventoryService.getAllItems();
    }
}
