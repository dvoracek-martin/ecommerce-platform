package com.dvoracekmartin.catalogservice.application.dto.product;

import com.dvoracekmartin.catalogservice.application.dto.base.BaseUpdateOrResponseDTO;
import com.dvoracekmartin.catalogservice.application.dto.media.MediaDTO;
import com.dvoracekmartin.catalogservice.application.dto.tag.ResponseTagDTO;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ResponseProductDTO extends BaseUpdateOrResponseDTO {

    private Double price;
    private Double weightGrams;
    private List<ResponseTagDTO> responseTagDTOS;
    private Long categoryId;

    public ResponseProductDTO(Long id,
                              String name,
                              String description,
                              int priority,
                              boolean active,
                              List<MediaDTO> media,
                              List<ResponseTagDTO> responseTagDTOS,
                              Long categoryId,
                              Double price,
                              Double weightGrams
    ) {
        super(id, name, description, priority, active, media);
        this.responseTagDTOS = responseTagDTOS;
        this.categoryId = categoryId;
        this.price = price;
        this.weightGrams = weightGrams;
    }
}
