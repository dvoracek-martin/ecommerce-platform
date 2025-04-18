package com.dvoracekmartin.catalogservice.application.dto;

import com.dvoracekmartin.catalogservice.domain.model.Product;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ProductMapper extends CatalogMapper {

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
                responseMedia
        );
    }
}
