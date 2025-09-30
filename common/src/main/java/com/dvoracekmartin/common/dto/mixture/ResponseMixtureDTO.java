package com.dvoracekmartin.common.dto.mixture;

import com.dvoracekmartin.common.dto.base.BaseUpdateOrResponseDTO;
import com.dvoracekmartin.common.dto.media.MediaDTO;
import com.dvoracekmartin.common.dto.product.ResponseProductDTO;
import com.dvoracekmartin.common.event.translation.LocalizedField;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;
import java.util.Map;

@EqualsAndHashCode(callSuper = true)
@Data
public class ResponseMixtureDTO extends BaseUpdateOrResponseDTO {
    private Double price;
    private Double weightGrams;
    private Long categoryId;
    private List<ResponseProductDTO> products;
    private List<Long> tagIds;
    private boolean displayInProducts;
    private String name;

    public ResponseMixtureDTO(Long id,
                              String name,
                              Map<String, LocalizedField> localizedFields,
                              int priority,
                              boolean active,
                              List<MediaDTO> media,
                              Long categoryId,
                              List<ResponseProductDTO> products,
                              List<Long> tagIds,
                              Double price,
                              Double weightGrams,
                              boolean displayInProducts
    ) {
        super(id, localizedFields, priority, active, media);
        this.name=name;
        this.categoryId = categoryId;
        this.products = products;
        this.tagIds = tagIds;
        this.price = price;
        this.weightGrams = weightGrams;
        this.displayInProducts = displayInProducts;
    }
}
