package com.dvoracekmartin.catalogservice.application.dto;

import com.dvoracekmartin.catalogservice.application.dto.category.CreateCategoryDTO;
import com.dvoracekmartin.catalogservice.application.dto.category.ResponseCatalogItemDTO;
import com.dvoracekmartin.catalogservice.application.dto.category.ResponseCategoryDTO;
import com.dvoracekmartin.catalogservice.application.dto.category.UpdateCategoryDTO;
import com.dvoracekmartin.catalogservice.application.dto.media.ResponseMediaDTO;
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
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface CatalogMapper {
    ResponseCatalogItemDTO mapProductToResponseCatalogItemDTO(Product product);

    ResponseCatalogItemDTO mapMixtureToResponseCatalogItemDTO(Mixture mixture);

    ResponseCategoryDTO mapCategoryToResponseCategoryDTO(Category category);

    ResponseProductDTO mapProductToResponseProductDTO(Product product);

    default ResponseProductDTO mapProductToResponseProductDTO(Product product, List<ResponseMediaDTO> responseMedia) {
        return new ResponseProductDTO(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getImages(),
                product.getCategory().getId(),
                product.getScentProfile(),
                product.getBotanicalName(),
                product.getExtractionMethod(),
                product.getOrigin(),
                product.getUsageInstructions(),
                product.getVolumeMl(),
                product.getWarnings(),
                product.getMedicinalUse(),
                product.getWeightGrams(),
                product.getAllergens(),
                product.getTags().stream().map(this::mapTagToResponseTagDTO).toList(),
                responseMedia);
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
        return new Tag(
                null,
                createTagDTO.name(),
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
