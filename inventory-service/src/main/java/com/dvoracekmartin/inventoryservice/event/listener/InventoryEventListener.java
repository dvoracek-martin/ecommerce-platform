package com.dvoracekmartin.inventoryservice.event.listener;

import com.dvoracekmartin.common.event.ResponseProductStockEvent;
import com.dvoracekmartin.common.event.UpdateProductStockEvent;
import com.dvoracekmartin.inventoryservice.application.service.InventoryService;
import com.dvoracekmartin.inventoryservice.domain.model.Inventory;
import com.dvoracekmartin.inventoryservice.domain.repository.InventoryRepository;
import com.dvoracekmartin.inventoryservice.event.publisher.InventoryEventPublisher;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryEventListener {

    private final ObjectMapper objectMapper;
    private final InventoryService inventoryService;
    private final InventoryRepository inventoryRepository;
    private final InventoryEventPublisher inventoryEventPublisher;

    @KafkaListener(topics = "${global.kafka.topics.inventories.inventory-update}", groupId = "inventory-service-group")
    public void handleInventoryUpdate(UpdateProductStockEvent message) {
        ResponseProductStockEvent result = inventoryService.updateInventory(message.productId(), message);
        log.info("Inventory updated for product {}: new stock = {}", result.productId(), result.stock());
    }

    @KafkaListener(topics = "${global.kafka.topics.inventories.inventory-request}", groupId = "inventory-service-group")
    public void handleInventoryRequest(String message) {
        try {
            Map<String, Object> request = objectMapper.readValue(message, Map.class);
            Long productId = extractProductId(request, message);

            Optional<Inventory> productInventoryOptional = inventoryRepository.findByProductId(productId);

            inventoryEventPublisher.sendInventoryResponse(productId, productInventoryOptional);
        } catch (Exception e) {
            log.error("Error handling inventory request:", e);
        }
    }

    private Long extractProductId(Map<String, Object> request, String message) {
        Object productIdObj = request.get("productId");
        if (productIdObj instanceof Integer) {
            return ((Integer) productIdObj).longValue();
        } else if (productIdObj instanceof Long) {
            return (Long) productIdObj;
        } else {
            log.error("Invalid productId type in message: {}", message);
            return null;
        }
    }
}
