package com.dvoracekmartin.catalogservice.application.dto.category;

import com.dvoracekmartin.common.dto.base.BaseCreateDTO;
import com.dvoracekmartin.common.dto.media.MediaDTO;
import com.dvoracekmartin.common.event.translation.LocalizedField;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
public class CreateCategoryDTO extends BaseCreateDTO {

    private List<Long> tagIds;
    private boolean mixable;

    public CreateCategoryDTO(Map<String, LocalizedField> localizedFields, int priority, boolean active, List<MediaDTO> media, List<Long> tagIds, boolean mixable) {
        super(localizedFields, priority, active, media);
        this.tagIds = tagIds;
        this.mixable = mixable;
    }
}
