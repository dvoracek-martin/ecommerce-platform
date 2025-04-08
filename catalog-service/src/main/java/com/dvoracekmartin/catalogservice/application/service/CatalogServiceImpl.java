package com.dvoracekmartin.catalogservice.application.service;

import com.dvoracekmartin.catalogservice.application.dto.*;
import com.dvoracekmartin.catalogservice.domain.model.Category;
import com.dvoracekmartin.catalogservice.domain.model.Mixture;
import com.dvoracekmartin.catalogservice.domain.model.Product;
import com.dvoracekmartin.catalogservice.domain.repository.CategoryRepository;
import com.dvoracekmartin.catalogservice.domain.repository.MixtureRepository;
import com.dvoracekmartin.catalogservice.domain.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class CatalogServiceImpl implements CatalogService {

    private final ProductRepository productRepository;
    private final MixtureRepository mixtureRepository;
    private final CategoryRepository categoryRepository;
    private final CatalogMapper catalogMapper;

    private static final Logger LOG = LoggerFactory.getLogger(CatalogServiceImpl.class);

    public CatalogServiceImpl(ProductRepository productRepository, MixtureRepository mixtureRepository, CategoryRepository categoryRepository, CatalogMapper catalogMapper) {
        this.productRepository = productRepository;
        this.mixtureRepository = mixtureRepository;
        this.categoryRepository = categoryRepository;
        this.catalogMapper = catalogMapper;
    }

    @Override
    public List<ResponseProductDTO> getAllProducts() {
        LOG.info("Fetching all products");
        List<Product> products = productRepository.findAll();
        return products.stream().map(catalogMapper::mapProductToResponseProductDTO).collect(Collectors.toList());
    }

    @Override
    public List<ResponseMixtureDTO> getAllMixtures() {
        LOG.info("Fetching all mixtures");
        List<Mixture> mixtures = mixtureRepository.findAll();
        return mixtures.stream().map(catalogMapper::mapMixtureToResponseMixtureDTO).collect(Collectors.toList());
    }

    @Override
    public List<ResponseCatalogItemDTO> getAllProductsAndMixtures() {
        LOG.info("Fetching all products and mixtures");
        List<ResponseCatalogItemDTO> responseList = new ArrayList<>();

        // 1) Fetch products and map to DTOs
        List<Product> products = productRepository.findAll();
        for (Product product : products) {
            ResponseCatalogItemDTO dto = catalogMapper.mapProductToResponseCatalogItemDTO(product);
            responseList.add(dto);
        }

        // 2) Fetch mixtures and map to DTOs
        List<Mixture> mixtures = mixtureRepository.findAll();
        for (Mixture mixture : mixtures) {
            ResponseCatalogItemDTO dto = catalogMapper.mapMixtureToResponseCatalogItemDTO(mixture);
            responseList.add(dto);
        }

        // 3) Return the combined list
        return responseList;
    }

    @Override
    public List<ResponseCategoryDTO> getAllCategories() {
        LOG.info("Fetching all categories");
        List<Category> categories = categoryRepository.findAll();
        return categories.stream().map(catalogMapper::mapCategoryToResponseCategoryDTO).collect(Collectors.toList());
    }

    @Override
    public ResponseProductDTO createProduct(CreateProductDTO createProductDTO) {
        LOG.info("Creating product: {}", createProductDTO);
        Product product = catalogMapper.mapCreateProductDTOToProduct(createProductDTO);
        Product savedProduct = productRepository.save(product);
        return catalogMapper.mapProductToResponseProductDTO(savedProduct);
    }

    @Override
    public ResponseProductDTO updateProduct(Long id, UpdateProductDTO updateProductDTO) {
        LOG.info("Updating product with id {}: {}", id, updateProductDTO);
        Product existingProduct = productRepository.findById(id).orElseThrow(() -> new RuntimeException("Product not found with id: " + id));

        // Update the existing product with data from the DTO
        catalogMapper.mapUpdateProductDTOToProduct(updateProductDTO);

        Product updatedProduct = productRepository.save(existingProduct);
        return catalogMapper.mapProductToResponseProductDTO(updatedProduct);
    }

    @Override
    public ResponseMixtureDTO createMixture(CreateMixtureDTO createMixtureDTO) {
        LOG.info("Creating mixture: {}", createMixtureDTO);
        Mixture mixture = catalogMapper.mapCreateMixtureDTOToMixture(createMixtureDTO);
        Mixture savedMixture = mixtureRepository.save(mixture);
        return catalogMapper.mapMixtureToResponseMixtureDTO(savedMixture);
    }

    @Override
    public ResponseMixtureDTO updateMixture(Long id, UpdateMixtureDTO updateMixtureDTO) {
        LOG.info("Updating mixture with id {}: {}", id, updateMixtureDTO);
        Mixture existingMixture = mixtureRepository.findById(id).orElseThrow(() -> new RuntimeException("Mixture not found with id: " + id));

        // Update the existing mixture with data from the DTO
        catalogMapper.mapUpdateMixtureDTOToMixture(updateMixtureDTO);

        Mixture updatedMixture = mixtureRepository.save(existingMixture);
        return catalogMapper.mapMixtureToResponseMixtureDTO(updatedMixture);
    }

    @Override
    public ResponseCategoryDTO createCategory(CreateCategoryDTO createCategoryDTO) {
        LOG.info("Creating category: {}", createCategoryDTO);
        Category category = catalogMapper.mapCreateCategoryDTOToCategory(createCategoryDTO);
        Category savedCategory = categoryRepository.save(category);
        return catalogMapper.mapCategoryToResponseCategoryDTO(savedCategory);
    }

    @Override
    public ResponseCategoryDTO updateCategory(Long id, UpdateCategoryDTO updateCategoryDTO) {
        LOG.info("Updating category with id {}: {}", id, updateCategoryDTO);
        Category existingCategory = categoryRepository.findById(id).orElseThrow(() -> new RuntimeException("Category not found with id: " + id));

        // Update the existing category with data from the DTO
        catalogMapper.mapUpdateCategoryDTOToCategory(updateCategoryDTO);

        Category updatedCategory = categoryRepository.save(existingCategory);
        return catalogMapper.mapCategoryToResponseCategoryDTO(updatedCategory);
    }

    @Override
    public ResponseProductDTO getProductById(Long id) {
        LOG.info("Fetching product with id: {}", id);
        Product product = productRepository.findById(id).orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
        return catalogMapper.mapProductToResponseProductDTO(product);
    }

    @Override
    public ResponseMixtureDTO getMixtureById(Long id) {
        LOG.info("Fetching mixture with id: {}", id);
        Mixture mixture = mixtureRepository.findById(id).orElseThrow(() -> new RuntimeException("Mixture not found with id: " + id));
        return catalogMapper.mapMixtureToResponseMixtureDTO(mixture);
    }

    @Override
    public ResponseCategoryDTO getCategoryById(Long id) {
        LOG.info("Fetching category with id: {}", id);
        Category category = categoryRepository.findById(id).orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
        return catalogMapper.mapCategoryToResponseCategoryDTO(category);
    }

    @Override
    public void deleteProductById(Long id) {
        LOG.info("Deleting product with id: {}", id);
        productRepository.deleteById(id);
    }

    @Override
    public void deleteMixtureById(Long id) {
        LOG.info("Deleting mixture with id: {}", id);
        mixtureRepository.deleteById(id);
    }

    @Override
    public void deleteCategoryById(Long id) {
        LOG.info("Deleting category with id: {}", id);
        categoryRepository.deleteById(id);
    }
}
