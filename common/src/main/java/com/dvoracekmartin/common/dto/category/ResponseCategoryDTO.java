package com.dvoracekmartin.common.dto.category;

import com.dvoracekmartin.common.dto.base.BaseUpdateOrResponseDTO;
import com.dvoracekmartin.common.dto.media.MediaDTO;
import com.dvoracekmartin.common.dto.tag.ResponseTagDTO;
import com.dvoracekmartin.common.event.translation.LocalizedField;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;
import java.util.Map;

@EqualsAndHashCode(callSuper = true)
@Data
public class ResponseCategoryDTO extends BaseUpdateOrResponseDTO {

    private List<ResponseTagDTO> responseTagDTOS;
    private boolean mixable;

    public ResponseCategoryDTO(Long id, Map<String, LocalizedField> localizedFields, int priority, boolean active, List<MediaDTO> media, List<ResponseTagDTO> responseTagDTOS, boolean mixable) {
        super(id, localizedFields, priority, active, media);
        this.responseTagDTOS = responseTagDTOS;
        this.mixable = mixable;
    }
}
