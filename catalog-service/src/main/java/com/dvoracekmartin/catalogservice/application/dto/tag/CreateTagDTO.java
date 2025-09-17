package com.dvoracekmartin.catalogservice.application.dto.tag;

import com.dvoracekmartin.common.dto.base.BaseCreateDTO;
import com.dvoracekmartin.common.dto.media.MediaDTO;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

@EqualsAndHashCode(callSuper = true)
@Data
public class CreateTagDTO extends BaseCreateDTO {

    public CreateTagDTO(String name, String description, int priority, boolean active, List<MediaDTO> media) {
        super(name, description, priority, active, media);
    }
}
