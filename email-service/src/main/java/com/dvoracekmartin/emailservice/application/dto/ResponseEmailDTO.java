package com.dvoracekmartin.emailservice.application.dto;

import com.dvoracekmartin.common.event.translation.LocalizedField;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.Map;

@EqualsAndHashCode
@Data
@AllArgsConstructor
public class ResponseEmailDTO {
    @NotNull
    private Long id;
    String emailType;
    Map<String, LocalizedField> localizedFields;
}
