package com.dvoracekmartin.catalogservice.v1;

import com.dvoracekmartin.catalogservice.application.dto.*;
import com.dvoracekmartin.catalogservice.application.service.CatalogService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/catalog/v1/admin/")
@PreAuthorize("hasRole('user_admin')")
@Validated
public class CatalogAdminControllerV1 {

    private static final Logger LOG = LoggerFactory.getLogger(CatalogAdminControllerV1.class);
    private final CatalogService catalogService;

    public CatalogAdminControllerV1(CatalogService catalogService) {
        this.catalogService = catalogService;
    }

    @GetMapping("/all-products-and-mixtures")
    public List<ResponseCatalogItemDTO> getAllProductsAndMixtures() {
        LOG.info("Admin fetching all products and mixtures");
        return catalogService.getAllProductsAndMixtures();
    }

    @GetMapping("/all-products")
    public List<ResponseProductDTO> getAllProducts() {
        LOG.info("Admin fetching all products");
        return catalogService.getAllProducts();
    }

    @GetMapping("/all-mixtures")
    public List<ResponseMixtureDTO> getAllMixtures() {
        LOG.info("Admin fetching all mixtures");
        return catalogService.getAllMixtures();
    }

    @GetMapping("/all-categories")
    public List<ResponseCategoryDTO> getAllCategories() {
        LOG.info("Admin fetching all categories");
        return catalogService.getAllCategories();
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<ResponseProductDTO> getProductById(@PathVariable Long id) {
        LOG.info("Admin fetching product by id: {}", id);
        ResponseProductDTO productDTO = catalogService.getProductById(id);
        return ResponseEntity.ok(productDTO);
    }

    @GetMapping("/mixtures/{id}")
    public ResponseEntity<ResponseMixtureDTO> getMixtureById(@PathVariable Long id) {
        LOG.info("Admin fetching mixture by id: {}", id);
        ResponseMixtureDTO mixtureDTO = catalogService.getMixtureById(id);
        return ResponseEntity.ok(mixtureDTO);
    }

    @GetMapping("/categories/{id}")
    public ResponseEntity<ResponseCategoryDTO> getCategoryById(@PathVariable Long id) {
        LOG.info("Admin fetching category by id: {}", id);
        ResponseCategoryDTO categoryDTO = catalogService.getCategoryById(id);
        return ResponseEntity.ok(categoryDTO);
    }

    @PostMapping("/products")
    public ResponseEntity<List<ResponseProductDTO>> createProduct(@Valid @RequestBody List<CreateProductDTO> createProductDTO) {
        LOG.info("Admin creating products: {}", createProductDTO);
        List<ResponseProductDTO> createdProducts = catalogService.createProduct(createProductDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdProducts);
    }

    @PutMapping("/products/{id}")
    public ResponseEntity<ResponseProductDTO> updateProduct(@PathVariable Long id, @Valid @RequestBody UpdateProductDTO updateProductDTO) {
        LOG.info("Admin updating product with id {}: {}", id, updateProductDTO);
        ResponseProductDTO updatedProduct = catalogService.updateProduct(id, updateProductDTO);
        return ResponseEntity.ok(updatedProduct);
    }

    @PostMapping("/mixtures")
    public ResponseEntity<List<ResponseMixtureDTO>> createMixture(@Valid @RequestBody List<CreateMixtureDTO> createMixtureDTO) {
        LOG.info("Admin creating mixtures: {}", createMixtureDTO);
        List<ResponseMixtureDTO> createdMixtures = catalogService.createMixture(createMixtureDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdMixtures);
    }

    @PutMapping("/mixtures/{id}")
    public ResponseEntity<ResponseMixtureDTO> updateMixture(@PathVariable Long id, @Valid @RequestBody UpdateMixtureDTO updateMixtureDTO) {
        LOG.info("Admin updating mixture with id {}: {}", id, updateMixtureDTO);
        ResponseMixtureDTO updatedMixture = catalogService.updateMixture(id, updateMixtureDTO);
        return ResponseEntity.ok(updatedMixture);
    }

    @PostMapping("/categories")
    public ResponseEntity<List<ResponseCategoryDTO>> createCategory(@Valid @RequestBody List<CreateCategoryDTO> createCategoryDTO) {
        LOG.info("Admin creating categories: {}", createCategoryDTO);
        List<ResponseCategoryDTO> createdCategories = catalogService.createCategory(createCategoryDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdCategories);
    }

    @PutMapping("/categories/{id}")
    public ResponseEntity<ResponseCategoryDTO> updateCategory(@PathVariable Long id, @Valid @RequestBody UpdateCategoryDTO updateCategoryDTO) {
        LOG.info("Admin updating category with id {}: {}", id, updateCategoryDTO);
        ResponseCategoryDTO updatedCategory = catalogService.updateCategory(id, updateCategoryDTO);
        return ResponseEntity.ok(updatedCategory);
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        LOG.info("Admin deleting product with id: {}", id);
        catalogService.deleteProductById(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/mixtures/{id}")
    public ResponseEntity<Void> deleteMixture(@PathVariable Long id) {
        LOG.info("Admin deleting mixture with id: {}", id);
        catalogService.deleteMixtureById(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        LOG.info("Admin deleting category with id: {}", id);
        catalogService.deleteCategoryById(id);
        return ResponseEntity.noContent().build();
    }
}
