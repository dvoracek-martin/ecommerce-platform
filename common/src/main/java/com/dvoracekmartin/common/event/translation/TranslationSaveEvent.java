package com.dvoracekmartin.common.event.translation;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.Map;

@EqualsAndHashCode()
@Data
@AllArgsConstructor
@NoArgsConstructor
public class TranslationSaveEvent {
    private String correlationId;
    private TranslationObjectsEnum objectType;
    private Long entityId;
    private Map<String, LocalizedField> localizedFields;
}
