package com.dvoracekmartin.customerservice.application.event.publisher;

import com.dvoracekmartin.common.event.UpdateUserEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
@Slf4j
public class CustomerEventPublisher {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${global.kafka.topics.users.user-updated}")
    private String userUpdatedTopic;

    public CustomerEventPublisher(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publishUserUpdatedEvent(String userId, String username, String email, Integer preferredLanguageId, boolean active) {
        UpdateUserEvent event = new UpdateUserEvent(
                userId,
                username,
                email,
                preferredLanguageId,
                active
        );

        log.debug("Publishing event: {}", event);
        kafkaTemplate.send(userUpdatedTopic, userId, event);
    }
}
