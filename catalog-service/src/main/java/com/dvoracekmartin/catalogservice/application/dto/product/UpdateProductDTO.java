package com.dvoracekmartin.catalogservice.application.dto.product;

import com.dvoracekmartin.common.dto.base.BaseUpdateOrResponseDTO;
import com.dvoracekmartin.common.dto.media.MediaDTO;
import lombok.Data;

import java.util.List;

@Data
public class UpdateProductDTO extends BaseUpdateOrResponseDTO {


    private Long categoryId;
    private List<Long> tagIds;
    private Double price;
    private Double weightGrams;

    public UpdateProductDTO(Long id,
                            String name,
                            String description,
                            int priority,
                            boolean active,
                            List<MediaDTO> media,
                            List<Long> tagIds,
                            Long categoryId,
                            Double price,
                            Double weightGrams
    ) {
        super(id, name, description, priority, active, media);
        this.tagIds = tagIds;
        this.categoryId = categoryId;
        this.price = price;
        this.weightGrams = weightGrams;
    }
}
