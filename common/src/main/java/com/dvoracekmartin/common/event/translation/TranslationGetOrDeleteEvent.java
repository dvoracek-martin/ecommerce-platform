package com.dvoracekmartin.common.event.translation;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@EqualsAndHashCode()
@Data
@AllArgsConstructor
@NoArgsConstructor
public class TranslationGetOrDeleteEvent {
    private TranslationObjectsEnum objectType;
    private Long entityId;
}
