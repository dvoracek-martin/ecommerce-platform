package com.dvoracekmartin.catalogservice.application.dto.search;

import com.dvoracekmartin.catalogservice.application.dto.category.ResponseCategoryDTO;
import com.dvoracekmartin.catalogservice.application.dto.mixture.ResponseMixtureDTO;
import com.dvoracekmartin.catalogservice.application.dto.product.ResponseProductDTO;
import com.dvoracekmartin.catalogservice.application.dto.tag.ResponseTagDTO;

import java.util.List;

public record ResponseSearchResultDTO(
        List<ResponseProductDTO> products,
        List<ResponseCategoryDTO> categories,
        List<ResponseMixtureDTO> mixtures,
        List<ResponseTagDTO> tags) {
}
