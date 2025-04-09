package com.dvoracekmartin.common.event;

import java.time.Instant;

public record UserCreatedEvent(
        String userId,
        String username,
        String email,
        Instant createdAt
) {}
