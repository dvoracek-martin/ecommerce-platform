package com.dvoracekmartin.common.event.translation;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@Builder
public class TranslationResponseEvent {

    private String correlationId;
    private Map<String, LocalizedField> localizedFields;

    @JsonCreator
    public TranslationResponseEvent(
            @JsonProperty("correlationId") String correlationId,
            @JsonProperty("localizedFields") Map<String, LocalizedField> localizedFields) {
        this.correlationId = correlationId;
        this.localizedFields = localizedFields;
    }
}
