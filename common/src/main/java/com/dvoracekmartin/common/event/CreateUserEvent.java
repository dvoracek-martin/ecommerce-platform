package com.dvoracekmartin.common.event;

import java.time.Instant;

public record CreateUserEvent(
        String userId,
        String username,
        String email,
        Instant createdAt,
        Integer preferredLanguageId,
        boolean active
) {
}
