package com.dvoracekmartin.catalogservice.application.dto.utils;

import com.dvoracekmartin.catalogservice.application.dto.mixture.CreateMixtureDTO;
import com.dvoracekmartin.catalogservice.application.dto.mixture.UpdateMixtureDTO;
import com.dvoracekmartin.catalogservice.application.dto.tag.CreateTagDTO;
import com.dvoracekmartin.catalogservice.domain.model.Category;
import com.dvoracekmartin.catalogservice.domain.model.Mixture;
import com.dvoracekmartin.catalogservice.domain.model.Product;
import com.dvoracekmartin.catalogservice.domain.model.Tag;
import com.dvoracekmartin.common.dto.category.ResponseCategoryDTO;
import com.dvoracekmartin.common.dto.media.MediaDTO;
import com.dvoracekmartin.common.dto.mixture.ResponseMixtureDTO;
import com.dvoracekmartin.common.dto.product.ResponseProductDTO;
import com.dvoracekmartin.common.dto.tag.ResponseTagDTO;
import com.dvoracekmartin.common.event.translation.LocalizedField;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;
import java.util.Map;

@Mapper(componentModel = "spring")
public interface CatalogMapper {

    ResponseCategoryDTO mapCategoryToResponseCategoryDTO(Category category);

    default ResponseCategoryDTO mapCategoryToResponseCategoryDTO(Category category, List<MediaDTO> media, Map<String, LocalizedField> localizedFieldMap) {
        return new ResponseCategoryDTO(
                category.getId(),
                localizedFieldMap,
                category.getPriority(),
                category.isActive(),
                media,
                category.getTags().stream().map(this::mapTagToResponseTagDTO).toList(),
                category.isMixable()
        );
    }

    ResponseProductDTO mapProductToResponseProductDTO(Product product);

    default ResponseProductDTO mapProductToResponseProductDTO(Product product, List<MediaDTO> media, Map<String, LocalizedField> localizedFieldMap) {
        return new ResponseProductDTO(
                product.getId(),
                localizedFieldMap,
                product.getPriority(),
                product.isActive(),
                media,
                product.getTags().stream().map(this::mapTagToResponseTagDTO).toList(),
                product.getCategory().getId(),
                product.getPrice(),
                product.getWeightGrams(),
                product.isMixable(),
                product.isDisplayInProducts()
        );
    }

    ResponseMixtureDTO mapMixtureToResponseMixtureDTO(Mixture mixture);

    default ResponseMixtureDTO mapMixtureToResponseMixtureDTO(Mixture mixture, List<MediaDTO> media, Map<String, LocalizedField> localizedFieldMap) {
        return new ResponseMixtureDTO(
                mixture.getId(),
                mixture.getName(),
                localizedFieldMap,
                mixture.getPriority(),
                mixture.isActive(),
                media,
                mixture.getCategory().getId(),
                mixture.getProducts().stream().map(this::mapProductToResponseProductDTO).toList(),
                mixture.getTags().stream().map(Tag::getId).toList(),
                mixture.getPrice(),
                mixture.getWeightGrams(),
                mixture.isDisplayInProducts()
        );
    }

    Mixture mapCreateMixtureDTOToMixture(CreateMixtureDTO createMixtureDTO);

    Mixture mapUpdateMixtureDTOToMixture(UpdateMixtureDTO updateMixtureDTO);

    Product mapResponseProductDTOToProduct(ResponseProductDTO updateProductDTO);

    @Mapping(target = "products", ignore = true)
    @Mapping(target = "categories", ignore = true)
    @Mapping(target = "mixtures", ignore = true)
    Tag mapTagToTagDTO(Tag tag);

//    @Mapping(target = "products", ignore = true)
//    @Mapping(target = "categories", ignore = true)
//    @Mapping(target = "mixtures", ignore = true)
//    default Tag mapCreateTagDTOToTag(CreateTagDTO createTagDTO) {
//        return new Tag(
//                // TODO
//                //createTagDTO.getLocalizedBasicProperties()
//                //               .stream().map()
//                null,
//                null,
//                createTagDTO.getPriority(),
//                createTagDTO.isActive(),
//                null,
//                createTagDTO.getColor(),
//                createTagDTO.getIcon()
//        );
//    }


    @Mapping(target = "products", ignore = true)
    @Mapping(target = "categories", ignore = true)
    @Mapping(target = "mixtures", ignore = true)
    ResponseTagDTO mapTagToResponseTagDTO(Tag tag);

    default ResponseTagDTO mapTagToResponseTagDTO(Tag finalTag, Map<String, LocalizedField> translationMap) {
        return new ResponseTagDTO(
                finalTag.getId(),
                translationMap,
                finalTag.getPriority(),
                finalTag.isActive(),
                null,
                finalTag.getCategories().stream().map(this::mapCategoryToResponseCategoryDTO).toList(),
                finalTag.getProducts().stream().map(this::mapProductToResponseProductDTO).toList(),
                finalTag.getMixtures().stream().map(this::mapMixtureToResponseMixtureDTO).toList(),
                finalTag.getColor(),
                finalTag.getIcon()
        );
    }
}
