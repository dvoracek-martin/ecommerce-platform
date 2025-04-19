package com.dvoracekmartin.catalogservice.application.dto;

import com.dvoracekmartin.catalogservice.domain.model.Category;
import com.dvoracekmartin.catalogservice.domain.model.Mixture;
import com.dvoracekmartin.catalogservice.domain.model.Product;
import com.dvoracekmartin.catalogservice.domain.model.Tag;
import org.mapstruct.Mapper;

import javax.print.attribute.standard.Media;
import java.util.List;

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
                product.getTags().stream().map(this::mapTagToTagDTO).toList(),
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

    TagDTO mapTagToTagDTO(Tag tag);

    Tag mapTagDTOToTag(TagDTO tagDTO);

    ResponseMediaDTO mapMediaToResponseMediaDTO(Media media);
}
