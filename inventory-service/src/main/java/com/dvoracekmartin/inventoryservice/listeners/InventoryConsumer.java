package com.dvoracekmartin.inventoryservice.listeners;

import com.dvoracekmartin.common.dto.ResponseProductStockDTO;
import com.dvoracekmartin.common.event.UpdateProductStockEvent;
import com.dvoracekmartin.inventoryservice.application.service.InventoryService;
import com.dvoracekmartin.inventoryservice.domain.model.Inventory;
import com.dvoracekmartin.inventoryservice.domain.repository.InventoryRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryConsumer {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private final InventoryService inventoryService;
    private final InventoryRepository inventoryRepository;

    @KafkaListener(topics = "inventory-update-topic", groupId = "inventory-service-group")
    public void onMessage(UpdateProductStockEvent message) {
        ResponseProductStockDTO result = inventoryService.updateInventory(message.productId(), message);
        log.info("Inventory updated for product {}: new stock = {}", result.productId(), result.stock());
    }

    @KafkaListener(topics = "inventory-request-topic", groupId = "inventory-service-group")
    public void handleInventoryRequest(String message) {
        try {
            Map<String, Object> request = objectMapper.readValue(message, Map.class);
            Long productId = extractProductId(request, message);

            Optional<Inventory> productInventoryOptional = inventoryRepository.findByProductId(productId);
            sendInventoryResponse(productId, productInventoryOptional);
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

    private void sendInventoryResponse(Long productId, Optional<Inventory> productInventoryOptional) throws Exception {
        String inventoryResponseTopic = "inventory-response-topic";
        Map<String, Object> responseMap;

        if (productInventoryOptional.isPresent()) {
            int stock = productInventoryOptional.get().getStock();
            responseMap = Map.of("productId", productId, "stock", stock);
            log.info("Sent inventory response for product ID: {}", productId);
        } else {
            responseMap = Map.of("productId", productId, "stock", 0);
            log.warn("Product inventory not found for product ID: {}", productId);
        }

        String responseMessage = objectMapper.writeValueAsString(responseMap);
        kafkaTemplate.send(inventoryResponseTopic, responseMessage);
    }
}
