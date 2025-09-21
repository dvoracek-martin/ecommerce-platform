package com.dvoracekmartin.catalogservice.application.dto.category;

import com.dvoracekmartin.common.dto.base.BaseCreateDTO;
import com.dvoracekmartin.common.dto.media.MediaDTO;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
public class CreateCategoryDTO extends BaseCreateDTO {

    private List<Long> tagIds;
    private boolean mixable;

    public CreateCategoryDTO(String name, String description, int priority, boolean active, List<MediaDTO> media, List<Long> tagIds, boolean mixable, String url) {
        super(name, description, priority, active, media, url);
        this.tagIds = tagIds;
        this.mixable = mixable;
    }
}
