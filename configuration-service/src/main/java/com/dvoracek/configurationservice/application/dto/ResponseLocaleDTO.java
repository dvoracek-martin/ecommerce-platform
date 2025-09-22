package com.dvoracek.configurationservice.application.dto;

public record ResponseLocaleDTO(
        Long id,
        String languageCode,
        String regionCode) {
}
