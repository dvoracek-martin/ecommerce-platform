package com.dvoracekmartin.common.event;

public record UpdateUserEvent(
        String userId,
        String username,
        String email,
        String preferredLanguage,
        boolean active
) {
}
