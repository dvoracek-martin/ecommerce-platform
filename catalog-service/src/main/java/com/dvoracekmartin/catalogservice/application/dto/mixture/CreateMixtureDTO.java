package com.dvoracekmartin.catalogservice.application.dto.mixture;

import com.dvoracekmartin.catalogservice.application.dto.base.BaseCreateDTO;
import com.dvoracekmartin.catalogservice.application.dto.media.MediaDTO;
import lombok.Getter;
import lombok.Setter;

import java.util.List;


@Setter
@Getter
public class CreateMixtureDTO extends BaseCreateDTO {

    private Double price;
    private Double weightGrams;
    private Long categoryId;
    private List<Long> productIds;
    private List<Long> tagIds;

    public CreateMixtureDTO(String name,
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
        super(name, description, priority, active, media);
        this.categoryId = categoryId;
        this.productIds = productIds;
        this.tagIds = tagIds;
        this.price = price;
        this.weightGrams = weightGrams;
    }
}
