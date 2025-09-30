package com.dvoracekmartin.catalogservice.application.dto.product;

import com.dvoracekmartin.common.dto.base.BaseCreateDTO;
import com.dvoracekmartin.common.dto.media.MediaDTO;
import com.dvoracekmartin.common.event.translation.LocalizedField;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;
import java.util.Map;

@EqualsAndHashCode(callSuper = true)
@Data
public class CreateProductDTO extends BaseCreateDTO {

    private Double price;
    private Double weightGrams;
    private Long categoryId;
    private List<Long> tagIds;
    private boolean mixable;
    private boolean displayInProducts;

    public CreateProductDTO(
            Map<String, LocalizedField> localizedFields,
            int priority,
            boolean active,
            List<MediaDTO> media,
            Long categoryId,
            List<Long> tagIds,
            Double price,
            Double weightGrams,
            boolean mixable,
            boolean displayInProducts
    ) {
        super(localizedFields, priority, active, media);
        this.categoryId = categoryId;
        this.tagIds = tagIds;
        this.price = price;
        this.weightGrams = weightGrams;
        this.mixable = mixable;
        this.displayInProducts = displayInProducts;
    }
}
