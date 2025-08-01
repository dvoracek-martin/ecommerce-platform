package com.dvoracekmartin.catalogservice.application.dto.tag;

import com.dvoracekmartin.catalogservice.application.dto.category.CreateCategoryDTO;
import com.dvoracekmartin.catalogservice.application.dto.mixture.CreateMixtureDTO;
import com.dvoracekmartin.catalogservice.application.dto.product.CreateProductDTO;

import java.util.List;

public record CreateTagDTO(
        String name,
        List<CreateProductDTO> products,
        List<CreateCategoryDTO> categories,
        List<CreateMixtureDTO> mixtures
) {
}
