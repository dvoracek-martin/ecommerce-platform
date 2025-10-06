package com.dvoracekmartin.common.dto.email;

import com.dvoracekmartin.common.event.translation.LocalizedField;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.Map;
@EqualsAndHashCode
@Data
public class EmailDTO {
    private Map<String, LocalizedField> localizedFields;
    private String emailType;
    private String locale;
}
