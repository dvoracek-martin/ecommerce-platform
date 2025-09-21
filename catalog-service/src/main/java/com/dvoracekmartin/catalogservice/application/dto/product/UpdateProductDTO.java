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
    private boolean mixable;
    private boolean displayInProducts;

    public UpdateProductDTO(Long id,
                            String name,
                            String description,
                            int priority,
                            boolean active,
                            List<MediaDTO> media,
                            List<Long> tagIds,
                            Long categoryId,
                            Double price,
                            Double weightGrams,
                            boolean mixable,
                            boolean displayInProducts,
                            String url
    ) {
        super(id, name, description, priority, active, media, url);
        this.tagIds = tagIds;
        this.categoryId = categoryId;
        this.price = price;
        this.weightGrams = weightGrams;
        this.mixable = mixable;
        this.displayInProducts = displayInProducts;
    }
}
