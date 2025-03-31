package com.dvoracekmartin.commonevents.events;

import java.time.Instant;

public record UserCreatedEvent(
        String userId,
        String username,
        String email,
        Instant createdAt
) {}
