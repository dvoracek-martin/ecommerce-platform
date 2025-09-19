package com.dvoracekmartin.customerservice.application.event.listener;

import com.dvoracekmartin.common.event.CreateUserEvent;
import com.dvoracekmartin.customerservice.application.dto.CreateCustomerDTO;
import com.dvoracekmartin.customerservice.application.service.CustomerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomerEventListener {

    private final CustomerService customerService;

    @KafkaListener(topics = "${global.kafka.topics.users.user-created}", groupId = "customer-service-group")
    public void handleUserCreatedEvent(CreateUserEvent event) {
        log.info("Received UserCreatedEvent: {}", event);

        CreateCustomerDTO createCustomerDTO = new CreateCustomerDTO(
                event.userId(),
                event.username(),
                event.email(),
                null,
                null,
                null,
                null,
                null,
                event.preferredLanguage(),
                event.active()

        );
        customerService.createCustomer(createCustomerDTO);
    }
}
