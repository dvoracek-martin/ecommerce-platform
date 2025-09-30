package com.dvoracekmartin.catalogservice.application.dto.product;

import com.dvoracekmartin.common.dto.base.BaseUpdateOrResponseDTO;
import com.dvoracekmartin.common.dto.media.MediaDTO;
import com.dvoracekmartin.common.event.translation.LocalizedField;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;
import java.util.Map;

@EqualsAndHashCode(callSuper = true)
@Data
public class UpdateProductDTO extends BaseUpdateOrResponseDTO {

    private Long categoryId;
    private List<Long> tagIds;
    private Double price;
    private Double weightGrams;
    private boolean mixable;
    private boolean displayInProducts;

    public UpdateProductDTO(Long id,
                            Map<String, LocalizedField> localizedFields,
                            int priority,
                            boolean active,
                            List<MediaDTO> media,
                            List<Long> tagIds,
                            Long categoryId,
                            Double price,
                            Double weightGrams,
                            boolean mixable,
                            boolean displayInProducts
    ) {
        super(id, localizedFields, priority, active, media);
        this.tagIds = tagIds;
        this.categoryId = categoryId;
        this.price = price;
        this.weightGrams = weightGrams;
        this.mixable = mixable;
        this.displayInProducts = displayInProducts;
    }
}
