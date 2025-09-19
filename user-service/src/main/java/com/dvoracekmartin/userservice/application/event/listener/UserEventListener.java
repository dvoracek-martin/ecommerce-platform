package com.dvoracekmartin.userservice.application.event.listener;

import com.dvoracekmartin.common.event.UpdateUserEvent;
import com.dvoracekmartin.userservice.application.dto.UpdateUserDTO;
import com.dvoracekmartin.userservice.application.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserEventListener {

    private final UserService userService;

    @KafkaListener(topics = "${global.kafka.topics.users.user-updated}", groupId = "customer-service-group")
    public void handleUserCreatedEvent(UpdateUserEvent event) {
        log.info("Received UserCreatedEvent: {}", event);

        UpdateUserDTO updateUserDTO = new UpdateUserDTO(
                event.userId(),
                event.username(),
                event.email(),
                null,
                event.preferredLanguage(),
                event.active()

        );
        userService.updateUserWithoutCredentials(updateUserDTO);
    }
}
