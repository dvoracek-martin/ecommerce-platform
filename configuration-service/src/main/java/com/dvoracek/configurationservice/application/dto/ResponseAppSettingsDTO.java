package com.dvoracek.configurationservice.application.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;
import java.util.List;

@EqualsAndHashCode()
@Data
public class ResponseAppSettingsDTO {
    private Long id;
    private String theme;
    private List<ResponseLocaleDTO> usedLocales;
    private ResponseLocaleDTO defaultLocale;
    private String currency;
    private LocalDateTime updatedAt;
}
