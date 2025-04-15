package com.dvoracekmartin.catalogservice.application.service;

import com.dvoracekmartin.catalogservice.application.dto.*;
import com.dvoracekmartin.catalogservice.application.event.publisher.CatalogEventPublisher;
import com.dvoracekmartin.catalogservice.domain.model.Category;
import com.dvoracekmartin.catalogservice.domain.model.Mixture;
import com.dvoracekmartin.catalogservice.domain.model.Product;
import com.dvoracekmartin.catalogservice.domain.repository.CategoryRepository;
import com.dvoracekmartin.catalogservice.domain.repository.MixtureRepository;
import com.dvoracekmartin.catalogservice.domain.repository.ProductRepository;
import com.dvoracekmartin.catalogservice.domain.service.CatalogDomainService;
import com.dvoracekmartin.common.event.ResponseProductStockEvent;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.function.Function;

import static java.util.Objects.nonNull;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class CatalogServiceImpl implements CatalogService {

    private final CatalogEventPublisher catalogEventPublisher;
    private final ProductRepository productRepository;
    private final MixtureRepository mixtureRepository;
    private final CategoryRepository categoryRepository;
    private final CatalogMapper catalogMapper;
    private final CatalogDomainService catalogDomainService;

    @Override
    public List<ResponseProductDTO> getAllProducts() {
        log.info("Fetching all products");
        return productRepository.findAll().stream()
                .map(catalogMapper::mapProductToResponseProductDTO)
                .toList();
    }

    @Override
    public List<ResponseMixtureDTO> getAllMixtures() {
        log.info("Fetching all mixtures");
        return mixtureRepository.findAll().stream()
                .map(catalogMapper::mapMixtureToResponseMixtureDTO)
                .toList();
    }

    @Override
    public List<ResponseCatalogItemDTO> getAllProductsAndMixtures() {
        log.info("Fetching all products and mixtures");
        List<ResponseCatalogItemDTO> products = new ArrayList<>(productRepository.findAll().stream()
                .map(catalogMapper::mapProductToResponseCatalogItemDTO)
                .toList());

        List<ResponseCatalogItemDTO> mixtures = mixtureRepository.findAll().stream()
                .map(catalogMapper::mapMixtureToResponseCatalogItemDTO)
                .toList();

        products.addAll(mixtures);
        return products;
    }

    @Override
    public List<ResponseCategoryDTO> getAllCategories() {
        log.info("Fetching all categories");
        return categoryRepository.findAll().stream()
                .map(catalogMapper::mapCategoryToResponseCategoryDTO)
                .toList();
    }

    @Override
    public List<ResponseProductDTO> createProduct(@Valid List<CreateProductDTO> createProductDTOList) {
        log.info("Creating products: {}", createProductDTOList);
        return productRepository.saveAll(createProductDTOList.stream()
                        .map(catalogMapper::mapCreateProductDTOToProduct)
                        .toList())
                .stream()
                .map(catalogMapper::mapProductToResponseProductDTO)
                .toList();
    }

    @Override
    public ResponseProductDTO updateProduct(Long id, UpdateProductDTO updateProductDTO) {
        log.info("Updating product with id {}: {}", id, updateProductDTO);
        Product existingProduct = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));

        catalogMapper.mapUpdateProductDTOToProduct(updateProductDTO);

        return catalogMapper.mapProductToResponseProductDTO(productRepository.save(existingProduct));
    }

    @Override
    public ResponseProductStockEvent updateProductStockDTO(Long id, UpdateProductStockDTO updateProductStockDTO) {
        if (!id.equals(updateProductStockDTO.productId())) {
            throw new IllegalArgumentException("Product ID in the path does not match the ID in the message");
        }

        catalogEventPublisher.publishInventoryUpdateTopic(updateProductStockDTO.productId(), updateProductStockDTO.stock());

        return new ResponseProductStockEvent(updateProductStockDTO.productId(), updateProductStockDTO.stock());
    }

    @Override
    @Cacheable(value = "productStock", key = "#productId")
    public ResponseProductStockEvent getProductStock(Long productId) {
        log.info("Requesting stock for product ID: {}", productId);

        Integer stock = catalogDomainService.getProductStockFromInventory(productId);

        if (nonNull(stock)) {
            log.info("Received stock for product ID {}: {}", productId, stock);
            return new ResponseProductStockEvent(productId, stock);
        }

        log.warn("Failed to retrieve stock for product ID: {}", productId);
        return null;
    }

    @Override
    public List<ResponseMixtureDTO> createMixture(@Valid List<CreateMixtureDTO> createMixtureDTOList) {
        log.info("Creating mixtures: {}", createMixtureDTOList);
        return mixtureRepository.saveAll(createMixtureDTOList.stream()
                        .map(catalogMapper::mapCreateMixtureDTOToMixture)
                        .toList())
                .stream()
                .map(catalogMapper::mapMixtureToResponseMixtureDTO)
                .toList();
    }

    @Override
    public ResponseMixtureDTO updateMixture(Long id, UpdateMixtureDTO updateMixtureDTO) {
        log.info("Updating mixture with id {}: {}", id, updateMixtureDTO);
        Mixture existingMixture = mixtureRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Mixture not found with id: " + id));

        catalogMapper.mapUpdateMixtureDTOToMixture(updateMixtureDTO);

        return catalogMapper.mapMixtureToResponseMixtureDTO(mixtureRepository.save(existingMixture));
    }

    @Override
    public List<ResponseCategoryDTO> createCategory(@Valid List<CreateCategoryDTO> createCategoryDTOList) {
        log.info("Creating categories: {}", createCategoryDTOList);
        return categoryRepository.saveAll(createCategoryDTOList.stream()
                        .map(catalogMapper::mapCreateCategoryDTOToCategory)
                        .toList())
                .stream()
                .map(catalogMapper::mapCategoryToResponseCategoryDTO)
                .toList();
    }

    @Override
    public ResponseCategoryDTO updateCategory(Long id, UpdateCategoryDTO updateCategoryDTO) {
        log.info("Updating category with id {}: {}", id, updateCategoryDTO);
        Category existingCategory = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));

        catalogMapper.mapUpdateCategoryDTOToCategory(updateCategoryDTO);

        return catalogMapper.mapCategoryToResponseCategoryDTO(categoryRepository.save(existingCategory));
    }

    @Override
    public ResponseProductDTO getProductById(Long id) {
        return getEntityById(id, productRepository::findById, catalogMapper::mapProductToResponseProductDTO, "Product");
    }

    @Override
    public ResponseMixtureDTO getMixtureById(Long id) {
        return getEntityById(id, mixtureRepository::findById, catalogMapper::mapMixtureToResponseMixtureDTO, "Mixture");
    }

    @Override
    public ResponseCategoryDTO getCategoryById(Long id) {
        return getEntityById(id, categoryRepository::findById, catalogMapper::mapCategoryToResponseCategoryDTO, "Category");
    }

    @Override
    public void deleteProductById(Long id) {
        log.info("Deleting product with id: {}", id);
        productRepository.deleteById(id);
    }

    @Override
    public void deleteMixtureById(Long id) {
        log.info("Deleting mixture with id: {}", id);
        mixtureRepository.deleteById(id);
    }

    @Override
    public void deleteCategoryById(Long id) {
        log.info("Deleting category with id: {}", id);
        categoryRepository.deleteById(id);
    }

    private <T, R> R getEntityById(Long id, Function<Long, java.util.Optional<T>> findById, Function<T, R> mapper, String entityName) {
        log.info("Fetching {} with id: {}", entityName, id);
        return findById.apply(id)
                .map(mapper)
                .orElseThrow(() -> new RuntimeException(entityName + " not found with id: " + id));
    }
}
