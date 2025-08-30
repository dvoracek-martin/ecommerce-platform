package com.dvoracekmartin.catalogservice.application.dto.category;

import com.dvoracekmartin.catalogservice.application.dto.base.BaseUpdateOrResponseDTO;
import com.dvoracekmartin.catalogservice.application.dto.media.MediaDTO;
import lombok.Data;

import java.util.List;

@Data
public class UpdateCategoryDTO extends BaseUpdateOrResponseDTO {

    private List<Long> tagIds;

    public UpdateCategoryDTO(Long id, String name, String description, int priority, boolean active, List<MediaDTO> media, List<Long> tagIds) {
        super(id, name, description, priority, active, media);
        this.tagIds = tagIds;
    }
}
