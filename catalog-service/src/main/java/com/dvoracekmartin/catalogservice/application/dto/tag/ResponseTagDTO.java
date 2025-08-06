package com.dvoracekmartin.catalogservice.application.dto.tag;

import com.dvoracekmartin.catalogservice.application.dto.category.ResponseCategoryDTO;
import com.dvoracekmartin.catalogservice.application.dto.mixture.ResponseMixtureDTO;
import com.dvoracekmartin.catalogservice.application.dto.product.ResponseProductDTO;

import java.util.List;

public record ResponseTagDTO(
        Long id,
        String name,
        List<ResponseProductDTO> products,
        List<ResponseCategoryDTO> categories,
        List<ResponseMixtureDTO> mixtures
) {
}
