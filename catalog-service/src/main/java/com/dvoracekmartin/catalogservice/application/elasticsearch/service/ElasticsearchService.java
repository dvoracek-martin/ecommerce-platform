package com.dvoracekmartin.catalogservice.application.elasticsearch.service;

import com.dvoracekmartin.catalogservice.application.dto.category.ResponseCategoryDTO;
import com.dvoracekmartin.catalogservice.application.dto.mixture.ResponseMixtureDTO;
import com.dvoracekmartin.catalogservice.application.dto.product.ResponseProductDTO;
import com.dvoracekmartin.catalogservice.application.dto.search.ResponseSearchResultDTO;
import com.dvoracekmartin.catalogservice.application.dto.tag.ResponseTagDTO;

import java.util.List;

public interface ElasticsearchService {
    void indexAll(List<ResponseCategoryDTO> allCategories, List<ResponseProductDTO> allProducts, List<ResponseMixtureDTO> allMixtures, List<ResponseTagDTO> allTags);

    ResponseSearchResultDTO searchProductsAndMixtures(String query);

    ResponseSearchResultDTO search(String query);

    void indexProduct(ResponseProductDTO responseProductDTO);

    void indexCategory(ResponseCategoryDTO responseCategoryDTO);

    void indexMixture(ResponseMixtureDTO responseMixtureDTO);

    void indexTag(ResponseTagDTO responseTagDTO);

    void deleteProduct(ResponseProductDTO responseProductDTO);

    void deleteCategory(ResponseCategoryDTO responseCategoryDTO);

    void deleteMixture(ResponseMixtureDTO responseMixtureDTO);

    void deleteTag(ResponseTagDTO responseTagDTO);
}
