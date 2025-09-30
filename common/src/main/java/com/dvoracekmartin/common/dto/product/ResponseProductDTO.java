package com.dvoracekmartin.common.dto.product;

import com.dvoracekmartin.common.dto.base.BaseUpdateOrResponseDTO;
import com.dvoracekmartin.common.dto.media.MediaDTO;
import com.dvoracekmartin.common.dto.tag.ResponseTagDTO;
import com.dvoracekmartin.common.event.translation.LocalizedField;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;
import java.util.Map;

@EqualsAndHashCode(callSuper = true)
@Data
public class ResponseProductDTO extends BaseUpdateOrResponseDTO {

    boolean mixable;
    private Double price;
    private Double weightGrams;
    private List<ResponseTagDTO> responseTagDTOS;
    private Long categoryId;
    private boolean displayInProducts;

    public ResponseProductDTO(Long id,
                              Map<String, LocalizedField> localizedFields,
                              int priority,
                              boolean active,
                              List<MediaDTO> media,
                              List<ResponseTagDTO> responseTagDTOS,
                              Long categoryId,
                              Double price,
                              Double weightGrams,
                              boolean mixable,
                              boolean displayInProducts
    ) {
        super(id, localizedFields, priority, active, media);
        this.responseTagDTOS = responseTagDTOS;
        this.categoryId = categoryId;
        this.price = price;
        this.weightGrams = weightGrams;
        this.mixable = mixable;
        this.displayInProducts = displayInProducts;
    }
}
