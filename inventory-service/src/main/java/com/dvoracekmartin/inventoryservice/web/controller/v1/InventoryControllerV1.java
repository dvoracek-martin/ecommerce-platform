package com.dvoracekmartin.inventoryservice.web.controller.v1;

import com.dvoracekmartin.common.event.ResponseProductStockEvent;
import com.dvoracekmartin.common.event.UpdateProductStockEvent;
import com.dvoracekmartin.inventoryservice.application.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/inventories")
@RequiredArgsConstructor
public class InventoryControllerV1 {

    private final InventoryService inventoryService;

    @GetMapping("/{productId}")
    public ResponseEntity<ResponseProductStockEvent> getInventory(@PathVariable Long productId) {
        return ResponseEntity.ok(inventoryService.getInventory(productId));
    }

    @PutMapping("/{productId}")
    public ResponseEntity<ResponseProductStockEvent> updateInventory(
            @PathVariable Long productId,
            @RequestBody UpdateProductStockEvent updateProductStockEvent) {
        return ResponseEntity.ok(inventoryService.updateInventory(productId, updateProductStockEvent));
    }
}
