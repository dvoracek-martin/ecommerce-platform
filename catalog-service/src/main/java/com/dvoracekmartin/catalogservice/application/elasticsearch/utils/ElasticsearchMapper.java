package com.dvoracekmartin.catalogservice.application.elasticsearch.utils;

import com.dvoracekmartin.catalogservice.application.dto.category.ResponseCategoryDTO;
import com.dvoracekmartin.catalogservice.application.dto.mixture.ResponseMixtureDTO;
import com.dvoracekmartin.catalogservice.application.dto.product.ResponseProductDTO;
import com.dvoracekmartin.catalogservice.application.dto.tag.ResponseTagDTO;
import com.dvoracekmartin.catalogservice.application.elasticsearch.document.CategoryDocument;
import com.dvoracekmartin.catalogservice.application.elasticsearch.document.MixtureDocument;
import com.dvoracekmartin.catalogservice.application.elasticsearch.document.ProductDocument;
import com.dvoracekmartin.catalogservice.application.elasticsearch.document.TagDocument;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ElasticsearchMapper {
    CategoryDocument mapResponseCategoryDTOToCategoryDocument(ResponseCategoryDTO responseCategoryDTO);

    ResponseCategoryDTO mapCategoryDocumentToResponseCategoryDTO(CategoryDocument doc);

    ProductDocument mapResponseProductDTOToProductDocument(ResponseProductDTO responseProductDTO);

    ResponseProductDTO mapProductDocumentToResponseProductDTO(ProductDocument doc);

    MixtureDocument mapResponseMixtureDTOToMixtureDocument(ResponseMixtureDTO responseMixtureDTO);

    ResponseMixtureDTO mapMixtureDocumentToResponseMixtureDTO(MixtureDocument doc);

    TagDocument mapResponseTagDTOToTagDocument(ResponseTagDTO responseTagDTO);

    ResponseTagDTO mapTagDocumentToResponseTagDTO(TagDocument doc);

}
