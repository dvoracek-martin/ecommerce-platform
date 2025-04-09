package com.dvoracekmartin.catalogservice.application.service;

import com.dvoracekmartin.catalogservice.application.dto.*;
import com.dvoracekmartin.common.dto.ResponseProductStockDTO;
import jakarta.validation.Valid;

import java.util.List;

public interface CatalogService {

    List<ResponseProductDTO> getAllProducts();

    List<ResponseMixtureDTO> getAllMixtures();

    List<ResponseCatalogItemDTO> getAllProductsAndMixtures();

    List<ResponseCategoryDTO> getAllCategories();

    List<ResponseProductDTO> createProduct(@Valid List<CreateProductDTO> createProductDTO);

    ResponseProductDTO updateProduct(Long id, UpdateProductDTO updateProductDTO);

    ResponseProductStockDTO updateProductStockDTO(Long id, @Valid UpdateProductStockDTO updateProductStockDTO);

    ResponseProductStockDTO getProductStock(Long productId);

    List<ResponseMixtureDTO> createMixture(@Valid List<CreateMixtureDTO> createMixtureDTO);

    ResponseMixtureDTO updateMixture(Long id, UpdateMixtureDTO updateMixtureDTO);

    List<ResponseCategoryDTO> createCategory(@Valid List<CreateCategoryDTO> createCategoryDTO);

    ResponseCategoryDTO updateCategory(Long id, UpdateCategoryDTO updateCategoryDTO);

    ResponseProductDTO getProductById(Long id);

    ResponseMixtureDTO getMixtureById(Long id);

    ResponseCategoryDTO getCategoryById(Long id);

    void deleteProductById(Long id);

    void deleteMixtureById(Long id);

    void deleteCategoryById(Long id);
}
