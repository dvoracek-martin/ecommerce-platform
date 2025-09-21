package com.dvoracekmartin.common.dto.mixture;

import com.dvoracekmartin.common.dto.base.BaseUpdateOrResponseDTO;
import com.dvoracekmartin.common.dto.media.MediaDTO;
import com.dvoracekmartin.common.dto.product.ResponseProductDTO;
import lombok.Data;

import java.util.List;

@Data
public class ResponseMixtureDTO extends BaseUpdateOrResponseDTO {
    private Double price;
    private Double weightGrams;
    private Long categoryId;
    private List<ResponseProductDTO> products;
    private List<Long> tagIds;
    private boolean displayInProducts;

    public ResponseMixtureDTO(Long id,
                              String name,
                              String description,
                              int priority,
                              boolean active,
                              List<MediaDTO> media,
                              Long categoryId,
                              List<ResponseProductDTO> products,
                              List<Long> tagIds,
                              Double price,
                              Double weightGrams,
                              boolean displayInProducts,
                              String url
    ) {
        super(id, name, description, priority, active, media, url);
        this.categoryId = categoryId;
        this.products = products;
        this.tagIds = tagIds;
        this.price = price;
        this.weightGrams = weightGrams;
        this.displayInProducts = displayInProducts;
    }
}
