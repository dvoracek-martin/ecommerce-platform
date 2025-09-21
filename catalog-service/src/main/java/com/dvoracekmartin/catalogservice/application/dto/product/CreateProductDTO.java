package com.dvoracekmartin.catalogservice.application.dto.product;

import com.dvoracekmartin.common.dto.base.BaseCreateDTO;
import com.dvoracekmartin.common.dto.media.MediaDTO;
import lombok.Data;

import java.util.List;

@Data
public class CreateProductDTO extends BaseCreateDTO {

    private Double price;
    private Double weightGrams;
    private Long categoryId;
    private List<Long> tagIds;
    private boolean mixable;
    private boolean displayInProducts;

    public CreateProductDTO(String name,
                            String description,
                            int priority,
                            boolean active,
                            List<MediaDTO> media,
                            Long categoryId,
                            List<Long> tagIds,
                            Double price,
                            Double weightGrams,
                            boolean mixable,
                            boolean displayInProducts,
                            String url
    ) {
        super(name, description, priority, active, media, url);
        this.categoryId = categoryId;
        this.tagIds = tagIds;
        this.price = price;
        this.weightGrams = weightGrams;
        this.mixable = mixable;
        this.displayInProducts = displayInProducts;
    }
}
