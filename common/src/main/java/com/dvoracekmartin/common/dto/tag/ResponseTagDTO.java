package com.dvoracekmartin.common.dto.tag;

import com.dvoracekmartin.common.dto.base.BaseUpdateOrResponseDTO;
import com.dvoracekmartin.common.dto.category.ResponseCategoryDTO;
import com.dvoracekmartin.common.dto.media.MediaDTO;
import com.dvoracekmartin.common.dto.mixture.ResponseMixtureDTO;
import com.dvoracekmartin.common.dto.product.ResponseProductDTO;
import lombok.Data;

import java.util.List;

@Data
public class ResponseTagDTO extends BaseUpdateOrResponseDTO {

    List<ResponseCategoryDTO> categories;
    List<ResponseProductDTO> products;
    List<ResponseMixtureDTO> mixtures;

    public ResponseTagDTO(Long id, String name, String description, int priority, boolean active, List<MediaDTO> media, List<ResponseCategoryDTO> categories, List<ResponseProductDTO> products, List<ResponseMixtureDTO> mixtures, String url) {
        super(id, name, description, priority, active, media, url);
        this.categories = categories;
        this.products = products;
        this.mixtures = mixtures;
    }
}
