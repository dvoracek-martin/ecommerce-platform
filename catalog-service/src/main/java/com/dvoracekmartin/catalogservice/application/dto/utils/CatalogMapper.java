package com.dvoracekmartin.catalogservice.application.dto.utils;

import com.dvoracekmartin.catalogservice.application.dto.category.ResponseCategoryDTO;
import com.dvoracekmartin.catalogservice.application.dto.media.MediaDTO;
import com.dvoracekmartin.catalogservice.application.dto.mixture.CreateMixtureDTO;
import com.dvoracekmartin.catalogservice.application.dto.mixture.ResponseMixtureDTO;
import com.dvoracekmartin.catalogservice.application.dto.mixture.UpdateMixtureDTO;
import com.dvoracekmartin.catalogservice.application.dto.product.ResponseProductDTO;
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

    Mixture mapCreateMixtureDTOToMixture(CreateMixtureDTO createMixtureDTO);

    Mixture mapUpdateMixtureDTOToMixture(UpdateMixtureDTO updateMixtureDTO);

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
                createTagDTO.getName(),
                createTagDTO.getDescription(),
                createTagDTO.getPriority(),
                createTagDTO.isActive()
        );
    }


    @Mapping(target = "products", ignore = true)
    @Mapping(target = "categories", ignore = true)
    @Mapping(target = "mixtures", ignore = true)
    ResponseTagDTO mapTagToResponseTagDTO(Tag tag);
}
