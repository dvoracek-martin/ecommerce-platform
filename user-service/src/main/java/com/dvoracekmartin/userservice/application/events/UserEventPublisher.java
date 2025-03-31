package com.dvoracekmartin.userservice.application.events;

import com.dvoracekmartin.commonevents.events.UserCreatedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.time.Instant;

@Component
public class UserEventPublisher {

    private static final Logger LOG = LoggerFactory.getLogger(UserEventPublisher.class);

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${kafka.topic.userCreated}")
    private String userCreatedTopic;

    public UserEventPublisher(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publishUserCreatedEvent(String userId, String username, String email) {
        // Build the event
        UserCreatedEvent event = new UserCreatedEvent(
                userId,
                username,
                email,
                Instant.now()
        );

        LOG.info("Publishing event: {}", event);
        Mono.fromRunnable(() -> kafkaTemplate.send(userCreatedTopic, userId, event))
                .subscribe();
    }
}
