package com.dvoracekmartin.catalogservice.application.dto.mixture;

import com.dvoracekmartin.common.dto.base.BaseUpdateOrResponseDTO;
import com.dvoracekmartin.common.dto.media.MediaDTO;
import lombok.Data;

import java.util.List;

@Data
public class UpdateMixtureDTO extends BaseUpdateOrResponseDTO {
    private Double price;
    private Double weightGrams;
    private Long categoryId;
    private List<Long> productIds;
    private List<Long> tagIds;

    public UpdateMixtureDTO(Long id,
                            String name,
                            String description,
                            int priority,
                            boolean active,
                            List<MediaDTO> media,
                            Long categoryId,
                            List<Long> productIds,
                            List<Long> tagIds,
                            Double price,
                            Double weightGrams
    ) {
        super(id, name, description, priority, active, media);
        this.categoryId = categoryId;
        this.productIds = productIds;
        this.tagIds = tagIds;
        this.price = price;
        this.weightGrams = weightGrams;
    }
}
