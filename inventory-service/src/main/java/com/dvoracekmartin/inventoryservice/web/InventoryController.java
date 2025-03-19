package com.dvoracekmartin.inventoryservice.web;

import com.dvoracekmartin.inventoryservice.application.InventoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {
    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping("/{productCode}")
    public ResponseEntity<Boolean> checkAvailability(@PathVariable String productCode) {
        return ResponseEntity.ok(inventoryService.isProductAvailable(productCode));
    }

    @PostMapping("/deduct")
    public ResponseEntity<Void> deductStock(@RequestParam String productCode, @RequestParam int quantity) {
        inventoryService.deductStock(productCode, quantity);
        return ResponseEntity.noContent().build();
    }
}
