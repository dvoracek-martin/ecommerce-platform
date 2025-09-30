package com.dvoracekmartin.catalogservice.application.dto.mixture;

import com.dvoracekmartin.common.dto.base.BaseCreateDTO;
import com.dvoracekmartin.common.dto.media.MediaDTO;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;


@EqualsAndHashCode(callSuper = true)
@Data
public class CreateMixtureDTO extends BaseCreateDTO {

    private Double price;
    private Double weightGrams;
    private Long categoryId;
    private List<Long> productIds;
    private List<Long> tagIds;
    private boolean mixable;
    private boolean displayInProducts;
    private int priority;

    // for user created mixtures
    @NotBlank
    @Size(min = 3)
    private String name;


    public CreateMixtureDTO(String name,
                            int priority,
                            boolean active,
                            List<MediaDTO> media,
                            Long categoryId,
                            List<Long> productIds,
                            List<Long> tagIds,
                            Double price,
                            Double weightGrams,
                            boolean mixable,
                            boolean displayInProducts
    ) {
        super(null, priority, active, media);
        this.name = name;
        this.priority = priority;
        this.categoryId = categoryId;
        this.productIds = productIds;
        this.tagIds = tagIds;
        this.price = price;
        this.weightGrams = weightGrams;
        this.mixable = mixable;
        this.displayInProducts = displayInProducts;
    }
}
