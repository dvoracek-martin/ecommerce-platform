package com.dvoracekmartin.catalogservice.application.dto.search;

import com.dvoracekmartin.common.dto.category.ResponseCategoryDTO;
import com.dvoracekmartin.common.dto.mixture.ResponseMixtureDTO;
import com.dvoracekmartin.common.dto.product.ResponseProductDTO;
import com.dvoracekmartin.common.dto.tag.ResponseTagDTO;

import java.util.List;

public record ResponseSearchResultDTO(
        List<ResponseProductDTO> products,
        List<ResponseCategoryDTO> categories,
        List<ResponseMixtureDTO> mixtures,
        List<ResponseTagDTO> tags) {
}
