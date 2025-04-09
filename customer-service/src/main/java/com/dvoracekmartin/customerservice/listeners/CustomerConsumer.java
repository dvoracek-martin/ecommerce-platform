package com.dvoracekmartin.customerservice.listeners;

import com.dvoracekmartin.common.event.UserCreatedEvent;
import com.dvoracekmartin.customerservice.application.dto.CreateCustomerDTO;
import com.dvoracekmartin.customerservice.application.service.CustomerService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
public class CustomerConsumer {

    private static final Logger LOG = LoggerFactory.getLogger(CustomerConsumer.class);

    private final CustomerService customerService;

    public CustomerConsumer(CustomerService customerService) {
        this.customerService = customerService;
    }

    @KafkaListener(topics = "${kafka.topic.userCreated}", groupId = "customer-service-group")
    public void handleUserCreatedEvent(UserCreatedEvent event) {
        LOG.info("Received UserCreatedEvent: {}", event);

        CreateCustomerDTO createCustomerDTO = new CreateCustomerDTO(
                event.userId(),
                event.username(),
                event.email(),
                null,
                null,
                null,
                null,
                null
        );
        customerService.createCustomer(createCustomerDTO);
    }
}
