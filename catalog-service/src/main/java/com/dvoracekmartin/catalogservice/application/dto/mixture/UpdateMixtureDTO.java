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
    private boolean mixable;
    private boolean displayInProducts;

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
                            Double weightGrams,
                            boolean mixable,
                            boolean displayInProducts,
                            String url
    ) {
        super(id, name, description, priority, active, media, url);
        this.categoryId = categoryId;
        this.productIds = productIds;
        this.tagIds = tagIds;
        this.price = price;
        this.weightGrams = weightGrams;
        this.mixable = mixable;
        this.displayInProducts = displayInProducts;
    }
}
