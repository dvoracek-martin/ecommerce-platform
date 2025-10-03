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

    private String color;
    private String icon;

    public CreateTagDTO(Map<String, LocalizedField> localizedFields, int priority, boolean active, List<MediaDTO> media, String color, String icon) {
        super(localizedFields, priority, active, media);
        this.color = color;
        this.icon = icon;
    }
}
