package com.dvoracekmartin.catalogservice.application.dto.category;

import com.dvoracekmartin.common.dto.base.BaseUpdateOrResponseDTO;
import com.dvoracekmartin.common.dto.media.MediaDTO;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

@EqualsAndHashCode(callSuper = true)
@Data
public class UpdateCategoryDTO extends BaseUpdateOrResponseDTO {

    private List<Long> tagIds;
    private boolean mixable;

    public UpdateCategoryDTO(Long id, String name, String description, int priority, boolean active, List<MediaDTO> media, List<Long> tagIds, boolean mixable, String url) {
        super(id, name, description, priority, active, media, url);
        this.tagIds = tagIds;
        this.mixable = mixable;
    }
}

