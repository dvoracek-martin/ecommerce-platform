package com.dvoracekmartin.inventoryservice.event.publisher;

import com.dvoracekmartin.common.event.ResponseProductStockEvent;
import com.dvoracekmartin.inventoryservice.domain.model.Inventory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class InventoryEventPublisher {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${global.kafka.topics.inventories.inventory-response}")
    private String inventoryResponseTopic;


    public void sendInventoryResponse(Long productId, Optional<Inventory> productInventoryOptional) throws Exception {
        int stock = productInventoryOptional.map(Inventory::getStock).orElse(0);
        ResponseProductStockEvent response = new ResponseProductStockEvent(productId, stock); // Use your record

        kafkaTemplate.send(inventoryResponseTopic, response);

        if (productInventoryOptional.isPresent()) {
            log.info("Sent inventory response for product ID: {}", productId);
        } else {
            log.warn("Product inventory not found for product ID: {}", productId);
        }
    }
}
