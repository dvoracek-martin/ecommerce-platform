package com.dvoracekmartin.catalogservice.application.dto;

import com.dvoracekmartin.catalogservice.application.dto.category.CreateCategoryDTO;
import com.dvoracekmartin.catalogservice.application.dto.category.ResponseCatalogItemDTO;
import com.dvoracekmartin.catalogservice.application.dto.category.ResponseCategoryDTO;
import com.dvoracekmartin.catalogservice.application.dto.category.UpdateCategoryDTO;
import com.dvoracekmartin.catalogservice.application.dto.media.MediaDTO;
import com.dvoracekmartin.catalogservice.application.dto.mixture.CreateMixtureDTO;
import com.dvoracekmartin.catalogservice.application.dto.mixture.ResponseMixtureDTO;
import com.dvoracekmartin.catalogservice.application.dto.mixture.UpdateMixtureDTO;
import com.dvoracekmartin.catalogservice.application.dto.product.CreateProductDTO;
import com.dvoracekmartin.catalogservice.application.dto.product.ResponseProductDTO;
import com.dvoracekmartin.catalogservice.application.dto.product.UpdateProductDTO;
import com.dvoracekmartin.catalogservice.application.dto.tag.CreateTagDTO;
import com.dvoracekmartin.catalogservice.application.dto.tag.ResponseTagDTO;
import com.dvoracekmartin.catalogservice.domain.model.Category;
import com.dvoracekmartin.catalogservice.domain.model.Mixture;
import com.dvoracekmartin.catalogservice.domain.model.Product;
import com.dvoracekmartin.catalogservice.domain.model.Tag;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface CatalogMapper {
    ResponseCatalogItemDTO mapProductToResponseCatalogItemDTO(Product product);

    ResponseCatalogItemDTO mapMixtureToResponseCatalogItemDTO(Mixture mixture);

    ResponseCategoryDTO mapCategoryToResponseCategoryDTO(Category category);

    ResponseProductDTO mapProductToResponseProductDTO(Product product);

    default ResponseProductDTO mapProductToResponseProductDTO(Product product, List<MediaDTO> media) {
        return new ResponseProductDTO(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getPriority(),
                product.isActive(),
                media,
                product.getTags().stream().map(this::mapTagToResponseTagDTO).toList(),
                product.getCategory().getId(),
                product.getPrice(),
                product.getWeightGrams()
        );
    }

    ResponseMixtureDTO mapMixtureToResponseMixtureDTO(Mixture mixture);

    Category mapCreateCategoryDTOToCategory(CreateCategoryDTO createCategoryDTO);

    Mixture mapMixtureDTOToMixture(UpdateMixtureDTO updateMixtureDTO);

    Product mapUpdateProductDTOToProduct(UpdateProductDTO updateProductDTO);

    ResponseProductDTO mapUpdateCategoryToResponseCategoryDTO(UpdateCategoryDTO updateCategoryDTO);

    Mixture mapCreateMixtureDTOToMixture(CreateMixtureDTO createMixtureDTO);

    Product mapCreateProductDTOToProduct(CreateProductDTO createProductDTO);

    Mixture mapUpdateMixtureDTOToMixture(UpdateMixtureDTO updateMixtureDTO);

    Category mapUpdateCategoryDTOToCategory(UpdateCategoryDTO updateCategoryDTO);

    Mixture mapResponseMixtureDTOToMixture(ResponseMixtureDTO updateMixtureDTO);

    Category mapResponseCategoryDTOToCategory(ResponseCategoryDTO updateCategoryDTO);

    Product mapResponseProductDTOToProduct(ResponseProductDTO updateProductDTO);

    @Mapping(target = "products", ignore = true)
    @Mapping(target = "categories", ignore = true)
    @Mapping(target = "mixtures", ignore = true)
    Tag mapTagToTagDTO(Tag tag);

    @Mapping(target = "products", ignore = true)
    @Mapping(target = "categories", ignore = true)
    @Mapping(target = "mixtures", ignore = true)
    default Tag mapCreateTagDTOToTag(CreateTagDTO createTagDTO) {
        // FIXME
        return new Tag(
                null,
                null,
                null
        );
    }


    @Mapping(target = "products", ignore = true)
    @Mapping(target = "categories", ignore = true)
    @Mapping(target = "mixtures", ignore = true)
    ResponseTagDTO mapTagToResponseTagDTO(Tag tag);
}
