package com.dvoracekmartin.catalogservice.application.service;

import com.dvoracekmartin.catalogservice.application.dto.*;

import java.util.List;

public interface CatalogService {

    List<ResponseProductDTO> getAllProducts();

    List<ResponseMixtureDTO> getAllMixtures();

    List<ResponseCatalogItemDTO> getAllProductsAndMixtures();

    List<ResponseCategoryDTO> getAllCategories();

    ResponseProductDTO createProduct(CreateProductDTO createProductDTO);

    ResponseProductDTO updateProduct(Long id, UpdateProductDTO updateProductDTO);

    ResponseMixtureDTO createMixture(CreateMixtureDTO createMixtureDTO);

    ResponseMixtureDTO updateMixture(Long id, UpdateMixtureDTO updateMixtureDTO);

    ResponseCategoryDTO createCategory(CreateCategoryDTO createCategoryDTO);

    ResponseCategoryDTO updateCategory(Long id, UpdateCategoryDTO updateCategoryDTO);

    ResponseProductDTO getProductById(Long id);

    ResponseMixtureDTO getMixtureById(Long id);

    ResponseCategoryDTO getCategoryById(Long id);

    void deleteProductById(Long id);

    void deleteMixtureById(Long id);

    void deleteCategoryById(Long id);
}
