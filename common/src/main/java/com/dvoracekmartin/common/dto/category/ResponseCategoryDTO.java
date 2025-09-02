package com.dvoracekmartin.common.dto.category;

import com.dvoracekmartin.common.dto.base.BaseUpdateOrResponseDTO;
import com.dvoracekmartin.common.dto.media.MediaDTO;
import com.dvoracekmartin.common.dto.tag.ResponseTagDTO;
import lombok.Data;

import java.util.List;

@Data
public class ResponseCategoryDTO extends BaseUpdateOrResponseDTO {

    private List<ResponseTagDTO> tagIds;

    public ResponseCategoryDTO(Long id, String name, String description, int priority, boolean active, List<MediaDTO> media, List<ResponseTagDTO> tagIds) {
        super(id, name, description, priority, active, media);
        this.tagIds = tagIds;
    }
}
