package com.dvoracekmartin.catalogservice.application.dto.tag;

import com.dvoracekmartin.common.dto.base.BaseCreateDTO;
import com.dvoracekmartin.common.dto.media.MediaDTO;
import com.dvoracekmartin.common.event.translation.LocalizedField;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;
import java.util.Map;

@EqualsAndHashCode(callSuper = true)
@Data
public class CreateTagDTO extends BaseCreateDTO {

    public CreateTagDTO(Map<String, LocalizedField> localizedFields, int priority, boolean active, List<MediaDTO> media) {
        super(localizedFields, priority, active, media);
    }
}
