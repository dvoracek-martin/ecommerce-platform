package com.dvoracekmartin.catalogservice.application.dto.category;

import com.dvoracekmartin.common.dto.base.BaseUpdateOrResponseDTO;
import com.dvoracekmartin.common.dto.media.MediaDTO;
import com.dvoracekmartin.common.event.translation.LocalizedField;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;
import java.util.Map;

@EqualsAndHashCode(callSuper = true)
@Data
public class UpdateCategoryDTO extends BaseUpdateOrResponseDTO {

    private List<Long> tagIds;
    private boolean mixable;

    public UpdateCategoryDTO(Long id, Map<String, LocalizedField> localizedFields, int priority, boolean active, List<MediaDTO> media, List<Long> tagIds, boolean mixable) {
        super(id, localizedFields, priority, active, media);
        this.tagIds = tagIds;
        this.mixable = mixable;
    }
}

