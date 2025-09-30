package com.dvoracekmartin.catalogservice.application.dto.tag;

import com.dvoracekmartin.common.dto.base.BaseUpdateOrResponseDTO;
import com.dvoracekmartin.common.dto.media.MediaDTO;
import com.dvoracekmartin.common.event.translation.LocalizedField;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;
import java.util.Map;

@EqualsAndHashCode(callSuper = true)
@Data
public class UpdateTagDTO extends BaseUpdateOrResponseDTO {

    List<Long> categoryIds;
    List<Long> productIds;
    List<Long> mixtureIds;

    public UpdateTagDTO(Long id, Map<String, LocalizedField> localizedFields, int priority, boolean active, List<MediaDTO> media, List<Long> categoryIds, List<Long> productIds, List<Long> mixtureIds) {
        super(id, localizedFields, priority, active, media);
        this.categoryIds = categoryIds;
        this.productIds = productIds;
        this.mixtureIds = mixtureIds;
    }
}

