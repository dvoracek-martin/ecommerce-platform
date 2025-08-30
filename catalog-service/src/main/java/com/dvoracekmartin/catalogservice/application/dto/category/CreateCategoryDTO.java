package com.dvoracekmartin.catalogservice.application.dto.category;

import com.dvoracekmartin.catalogservice.application.dto.base.BaseCreateDTO;
import com.dvoracekmartin.catalogservice.application.dto.media.MediaDTO;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
public class CreateCategoryDTO extends BaseCreateDTO {


    private List<Long> tagIds;

    public CreateCategoryDTO(String name, String description, int priority, boolean active, List<MediaDTO> media, List<Long> tagIds) {
        super(name, description, priority, active, media);
        this.tagIds = tagIds;
    }
}
