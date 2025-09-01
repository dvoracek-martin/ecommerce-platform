package com.dvoracekmartin.catalogservice.application.dto.tag;

import com.dvoracekmartin.catalogservice.application.dto.base.BaseCreateDTO;
import com.dvoracekmartin.catalogservice.application.dto.media.MediaDTO;
import lombok.Data;

import java.util.List;

@Data
public class CreateTagDTO extends BaseCreateDTO {

    public CreateTagDTO(String name, String description, int priority, boolean active, List<MediaDTO> media) {
        super(name, description, priority, active, media);
    }
}
