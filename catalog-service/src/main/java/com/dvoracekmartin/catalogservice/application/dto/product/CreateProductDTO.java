package com.dvoracekmartin.catalogservice.application.dto.product;

import com.dvoracekmartin.catalogservice.application.dto.base.BaseCreateDTO;
import com.dvoracekmartin.catalogservice.application.dto.media.MediaDTO;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Setter
@Getter
public class CreateProductDTO extends BaseCreateDTO {

    private Double price;
    private Double weightGrams;
    private Long categoryId;
    private List<Long> tagIds;

    public CreateProductDTO(String name,
                            String description,
                            int priority,
                            boolean active,
                            List<MediaDTO> media,
                            Long categoryId,
                            List<Long> tagIds,
                            Double price,
                            Double weightGrams
    ) {
        super(name, description, priority, active, media);
        this.categoryId = categoryId;
        this.tagIds = tagIds;
        this.price = price;
        this.weightGrams = weightGrams;
    }
}
