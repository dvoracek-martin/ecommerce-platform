package com.dvoracekmartin.inventoryservice.web.controller;

import com.dvoracekmartin.inventoryservice.application.dto.ResponseInventoryItemDTO;
import com.dvoracekmartin.inventoryservice.application.dto.UpdateInventoryItemDTO;
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
    public ResponseInventoryItemDTO checkStock(@PathVariable String productCode) {
        return inventoryService.checkInventoryItemAvailability(productCode);
    }

    @GetMapping("/{productCode}")
    public ResponseInventoryItemDTO getInventoryItemByProductCode(@PathVariable String productCode) {
        return inventoryService.getInventoryItemByProductCode(productCode);
    }

    @PostMapping("/add")
    public void addStock(@RequestBody UpdateInventoryItemDTO updateInventoryItemDTO) {
        inventoryService.addInventoryItem(updateInventoryItemDTO);
    }

    @PostMapping("/deduct")
    public void deductStock(@RequestBody UpdateInventoryItemDTO updateInventoryItemDTO) {
        inventoryService.deductInventoryItem(updateInventoryItemDTO);
    }

    @GetMapping("/all")
    public List<ResponseInventoryItemDTO> getAllStock() {
        return inventoryService.getAllItems();
    }

    @DeleteMapping("/{productCode}")
    public void deleteInventoryItem(@PathVariable String productCode) {
        inventoryService.deleteInventoryItem(productCode);
    }

    @GetMapping("/check-availability/{productCode}")
    public ResponseInventoryItemDTO checkInventoryItemAvailability(@PathVariable String productCode) {
        return inventoryService.checkInventoryItemAvailability(productCode);
    }
}
