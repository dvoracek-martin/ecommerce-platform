package com.dvoracekmartin.common.dto.base;

import com.dvoracekmartin.common.dto.media.MediaDTO;
import com.dvoracekmartin.common.event.translation.LocalizedField;
import jakarta.validation.constraints.NotNull;
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
public abstract class BaseUpdateOrResponseDTO {


    @NotNull
    private Long id;

    Map<String, LocalizedField> localizedFields;

    private int priority;

    private boolean active;

    private List<MediaDTO> media;

}
