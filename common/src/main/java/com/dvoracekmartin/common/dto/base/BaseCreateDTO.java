package com.dvoracekmartin.common.dto.base;

import com.dvoracekmartin.common.dto.media.MediaDTO;
import com.dvoracekmartin.common.event.translation.LocalizedField;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.util.List;
import java.util.Map;

@EqualsAndHashCode()
@Data
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
public abstract class BaseCreateDTO {

    private Map<String, LocalizedField> localizedFields;

    private int priority;

    private boolean active;

    private List<MediaDTO> media;
}
