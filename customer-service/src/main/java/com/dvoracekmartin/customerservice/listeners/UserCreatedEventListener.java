package com.dvoracekmartin.customerservice.listeners;

import com.dvoracekmartin.commonevents.events.UserCreatedEvent;
import com.dvoracekmartin.customerservice.application.dto.CreateCustomerDTO;
import com.dvoracekmartin.customerservice.application.service.CustomerService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class UserCreatedEventListener {

    private static final Logger LOG = LoggerFactory.getLogger(UserCreatedEventListener.class);

    private final CustomerService customerService;

    public UserCreatedEventListener(CustomerService customerService) {
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
