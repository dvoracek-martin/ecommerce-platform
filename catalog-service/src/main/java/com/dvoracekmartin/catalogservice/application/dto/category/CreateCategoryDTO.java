package com.dvoracekmartin.catalogservice.application.dto.category;

import com.dvoracekmartin.catalogservice.application.dto.base.BaseCreateDTO;
import com.dvoracekmartin.catalogservice.application.dto.media.MediaDTO;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class CreateCategoryDTO extends BaseCreateDTO {

    private List<Long> tagIds;

    public CreateCategoryDTO(String name, String description, int priority, boolean active, List<MediaDTO> media, List<Long> tagIds) {
        super(name, description, priority, active, media);
        this.tagIds = tagIds;
    }
}
