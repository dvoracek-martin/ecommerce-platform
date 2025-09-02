package com.dvoracekmartin.catalogservice.application.dto.category;

import com.dvoracekmartin.common.dto.base.BaseCreateDTO;
import com.dvoracekmartin.common.dto.media.MediaDTO;
import lombok.Data;

import java.util.List;

@Data
public class CreateCategoryDTO extends BaseCreateDTO {


    private List<Long> tagIds;

    public CreateCategoryDTO(String name, String description, int priority, boolean active, List<MediaDTO> media, List<Long> tagIds) {
        super(name, description, priority, active, media);
        this.tagIds = tagIds;
    }
}
