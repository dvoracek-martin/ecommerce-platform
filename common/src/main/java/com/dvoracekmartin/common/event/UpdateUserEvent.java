package com.dvoracekmartin.common.event;

public record UpdateUserEvent(
        String userId,
        String username,
        String email,
        Integer preferredLanguageId,
        boolean active
) {
}
