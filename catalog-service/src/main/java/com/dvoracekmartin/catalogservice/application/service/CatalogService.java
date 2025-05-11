package com.dvoracekmartin.catalogservice.application.service;

import com.dvoracekmartin.catalogservice.application.dto.category.CreateCategoryDTO;
import com.dvoracekmartin.catalogservice.application.dto.category.ResponseCatalogItemDTO;
import com.dvoracekmartin.catalogservice.application.dto.category.ResponseCategoryDTO;
import com.dvoracekmartin.catalogservice.application.dto.category.UpdateCategoryDTO;
import com.dvoracekmartin.catalogservice.application.dto.mixture.CreateMixtureDTO;
import com.dvoracekmartin.catalogservice.application.dto.mixture.ResponseMixtureDTO;
import com.dvoracekmartin.catalogservice.application.dto.mixture.UpdateMixtureDTO;
import com.dvoracekmartin.catalogservice.application.dto.product.CreateProductDTO;
import com.dvoracekmartin.catalogservice.application.dto.product.ResponseProductDTO;
import com.dvoracekmartin.catalogservice.application.dto.product.UpdateProductDTO;
import com.dvoracekmartin.catalogservice.application.dto.product.UpdateProductStockDTO;
import com.dvoracekmartin.catalogservice.application.dto.tag.CreateTagDTO;
import com.dvoracekmartin.catalogservice.application.dto.tag.ResponseTagDTO;
import com.dvoracekmartin.catalogservice.application.dto.tag.UpdateTagDTO;
import com.dvoracekmartin.common.event.ResponseProductStockEvent;
import jakarta.validation.Valid;

import java.util.List;

public interface CatalogService {

    // === PRODUCTS ===

    List<ResponseProductDTO> getAllProducts();

    ResponseProductDTO getProductById(Long id);

    List<ResponseProductDTO> createProduct(@Valid List<CreateProductDTO> createProductDTO);

    ResponseProductDTO updateProduct(Long id, UpdateProductDTO updateProductDTO);

    ResponseProductStockEvent updateProductStockDTO(Long id, @Valid UpdateProductStockDTO updateProductStockDTO);

    ResponseProductStockEvent getProductStock(Long productId);

    void deleteProductById(Long id);

    // === MIXTURES ===

    List<ResponseMixtureDTO> getAllMixtures();

    ResponseMixtureDTO getMixtureById(Long id);

    List<ResponseMixtureDTO> createMixture(@Valid List<CreateMixtureDTO> createMixtureDTO);

    ResponseMixtureDTO updateMixture(Long id, UpdateMixtureDTO updateMixtureDTO);

    void deleteMixtureById(Long id);

    // === CATEGORIES ===

    List<ResponseCategoryDTO> getAllCategories();

    ResponseCategoryDTO getCategoryById(Long id);

    List<ResponseCategoryDTO> createCategory(@Valid List<CreateCategoryDTO> createCategoryDTO);

    ResponseCategoryDTO updateCategory(Long id, UpdateCategoryDTO updateCategoryDTO);

    void deleteCategoryById(Long id);

    // === TAGS ===

    List<ResponseTagDTO> getAllTags();

    ResponseTagDTO getTagById(Long id);

    List<ResponseTagDTO> createTags(@Valid List<CreateTagDTO> createTagDTOs);

    ResponseTagDTO updateTag(Long id, UpdateTagDTO updateTagDTO);

    void deleteTagById(Long id);

    // === COMBINED ===

    List<ResponseCatalogItemDTO> getAllProductsAndMixtures();
}
