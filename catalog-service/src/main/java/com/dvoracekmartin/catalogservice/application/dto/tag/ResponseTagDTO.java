package com.dvoracekmartin.catalogservice.application.dto.tag;

import com.dvoracekmartin.catalogservice.application.dto.base.BaseUpdateOrResponseDTO;
import com.dvoracekmartin.catalogservice.application.dto.category.ResponseCategoryDTO;
import com.dvoracekmartin.catalogservice.application.dto.media.MediaDTO;
import com.dvoracekmartin.catalogservice.application.dto.mixture.ResponseMixtureDTO;
import com.dvoracekmartin.catalogservice.application.dto.product.ResponseProductDTO;
import lombok.Data;

import java.util.List;

@Data
public class ResponseTagDTO extends BaseUpdateOrResponseDTO {

    List<ResponseCategoryDTO> categories;
    List<ResponseProductDTO> products;
    List<ResponseMixtureDTO> mixtures;

    public ResponseTagDTO(Long id, String name, String description, int priority, boolean active, List<MediaDTO> media, List<ResponseCategoryDTO> categories, List<ResponseProductDTO> products, List<ResponseMixtureDTO> mixtures) {
        super(id, name, description, priority, active, media);
        this.categories = categories;
        this.products = products;
        this.mixtures = mixtures;
    }
}
