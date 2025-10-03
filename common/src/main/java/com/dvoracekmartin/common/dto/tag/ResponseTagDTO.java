package com.dvoracekmartin.common.dto.tag;

import com.dvoracekmartin.common.dto.base.BaseUpdateOrResponseDTO;
import com.dvoracekmartin.common.dto.category.ResponseCategoryDTO;
import com.dvoracekmartin.common.dto.media.MediaDTO;
import com.dvoracekmartin.common.dto.mixture.ResponseMixtureDTO;
import com.dvoracekmartin.common.dto.product.ResponseProductDTO;
import com.dvoracekmartin.common.event.translation.LocalizedField;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;
import java.util.Map;

@EqualsAndHashCode(callSuper = true)
@Data
public class ResponseTagDTO extends BaseUpdateOrResponseDTO {

    List<ResponseCategoryDTO> categories;
    List<ResponseProductDTO> products;
    List<ResponseMixtureDTO> mixtures;
    String color;
    String icon;

    public ResponseTagDTO(Long id, Map<String, LocalizedField> localizedFields, int priority, boolean active, List<MediaDTO> media, List<ResponseCategoryDTO> categories, List<ResponseProductDTO> products, List<ResponseMixtureDTO> mixtures, String color, String icon) {
        super(id, localizedFields, priority, active, media);
        this.categories = categories;
        this.products = products;
        this.mixtures = mixtures;
        this.color = color;
        this.icon = icon;
    }
}
