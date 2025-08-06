package com.dvoracekmartin.catalogservice.v1;

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
import com.dvoracekmartin.catalogservice.application.dto.search.ResponseSearchResultDTO;
import com.dvoracekmartin.catalogservice.application.dto.tag.CreateTagDTO;
import com.dvoracekmartin.catalogservice.application.dto.tag.ResponseTagDTO;
import com.dvoracekmartin.catalogservice.application.dto.tag.UpdateTagDTO;
import com.dvoracekmartin.catalogservice.application.elasticsearch.service.ElasticsearchServiceImpl;
import com.dvoracekmartin.catalogservice.application.service.CatalogService;
import com.dvoracekmartin.common.event.ResponseProductStockEvent;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
@RequiredArgsConstructor
@Slf4j
public class CatalogAdminControllerV1 {

    private final CatalogService catalogService;
    private final ElasticsearchServiceImpl elasticsearchService;

    // === PRODUCTS ===

    @GetMapping("/all-products")
    public List<ResponseProductDTO> getAllProducts() {
        log.info("Admin fetching all products");
        return catalogService.getAllProducts();
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<ResponseProductDTO> getProductById(@PathVariable Long id) {
        log.info("Admin fetching product by id: {}", id);
        return ResponseEntity.ok(catalogService.getProductById(id));
    }

    @PostMapping("/products")
    public ResponseEntity<List<ResponseProductDTO>> createProduct(@Valid @RequestBody List<CreateProductDTO> createProductDTO) {
        log.info("Admin creating products: {}", createProductDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(catalogService.createProduct(createProductDTO));
    }

    @PutMapping("/products/{id}")
    public ResponseEntity<ResponseProductDTO> updateProduct(@PathVariable Long id, @Valid @RequestBody UpdateProductDTO updateProductDTO) {
        log.info("Admin updating product with id {}: {}", id, updateProductDTO);
        return ResponseEntity.ok(catalogService.updateProduct(id, updateProductDTO));
    }

    @PutMapping("/products/{id}/stock")
    public ResponseEntity<ResponseProductStockEvent> updateProductStock(@PathVariable Long id, @Valid @RequestBody UpdateProductStockDTO updateProductStockDTO) {
        log.info("Admin updating product stock with id {}: {}", id, updateProductStockDTO);
        return ResponseEntity.ok(catalogService.updateProductStockDTO(id, updateProductStockDTO));
    }

    @GetMapping("/products/{id}/stock")
    public ResponseEntity<ResponseProductStockEvent> getProductStock(@PathVariable Long id) {
        log.info("Getting stock for product ID: {}", id);
        ResponseProductStockEvent productStock = catalogService.getProductStock(id);
        return productStock != null ? ResponseEntity.ok(productStock) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        log.info("Admin deleting product with id: {}", id);
        catalogService.deleteProductById(id);
        return ResponseEntity.noContent().build();
    }

    // === MIXTURES ===

    @GetMapping("/all-mixtures")
    public List<ResponseMixtureDTO> getAllMixtures() {
        log.info("Admin fetching all mixtures");
        return catalogService.getAllMixtures();
    }

    @GetMapping("/mixtures/{id}")
    public ResponseEntity<ResponseMixtureDTO> getMixtureById(@PathVariable Long id) {
        log.info("Admin fetching mixture by id: {}", id);
        return ResponseEntity.ok(catalogService.getMixtureById(id));
    }

    @PostMapping("/mixtures")
    public ResponseEntity<List<ResponseMixtureDTO>> createMixture(@Valid @RequestBody List<CreateMixtureDTO> createMixtureDTO) {
        log.info("Admin creating mixtures: {}", createMixtureDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(catalogService.createMixture(createMixtureDTO));
    }

    @PutMapping("/mixtures/{id}")
    public ResponseEntity<ResponseMixtureDTO> updateMixture(@PathVariable Long id, @Valid @RequestBody UpdateMixtureDTO updateMixtureDTO) {
        log.info("Admin updating mixture with id {}: {}", id, updateMixtureDTO);
        return ResponseEntity.ok(catalogService.updateMixture(id, updateMixtureDTO));
    }

    @DeleteMapping("/mixtures/{id}")
    public ResponseEntity<Void> deleteMixture(@PathVariable Long id) {
        log.info("Admin deleting mixture with id: {}", id);
        catalogService.deleteMixtureById(id);
        return ResponseEntity.noContent().build();
    }

    // === CATEGORIES ===

    @GetMapping("/all-categories")
    public List<ResponseCategoryDTO> getAllCategories() {
        log.info("Admin fetching all categories");
        return catalogService.getAllCategories();
    }

    @GetMapping("/categories/{id}")
    public ResponseEntity<ResponseCategoryDTO> getCategoryById(@PathVariable Long id) {
        log.info("Admin fetching category by id: {}", id);
        return ResponseEntity.ok(catalogService.getCategoryById(id));
    }

    @PostMapping("/categories")
    public ResponseEntity<List<ResponseCategoryDTO>> createCategory(@Valid @RequestBody List<CreateCategoryDTO> createCategoryDTO) {
        log.info("Admin creating categories: {}", createCategoryDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(catalogService.createCategory(createCategoryDTO));
    }

    @PutMapping("/categories/{id}")
    public ResponseEntity<ResponseCategoryDTO> updateCategory(@PathVariable Long id, @Valid @RequestBody UpdateCategoryDTO updateCategoryDTO) {
        log.info("Admin updating category with id {}: {}", id, updateCategoryDTO);
        return ResponseEntity.ok(catalogService.updateCategory(id, updateCategoryDTO));
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        log.info("Admin deleting category with id: {}", id);
        catalogService.deleteCategoryById(id);
        return ResponseEntity.noContent().build();
    }

    // === TAGS ===

    @GetMapping("/all-tags")
    public List<ResponseTagDTO> getAllTags() {
        log.info("Admin fetching all tags");
        return catalogService.getAllTags();
    }

    @GetMapping("/tags/{id}")
    public ResponseEntity<ResponseTagDTO> getTagById(@PathVariable Long id) {
        log.info("Admin fetching tag by id: {}", id);
        return ResponseEntity.ok(catalogService.getTagById(id));
    }

    @PostMapping("/tags")
    public ResponseEntity<List<ResponseTagDTO>> createTags(@Valid @RequestBody List<CreateTagDTO> createTagDTOs) {
        log.info("Admin creating tags: {}", createTagDTOs);
        return ResponseEntity.status(HttpStatus.CREATED).body(catalogService.createTags(createTagDTOs));
    }

    @PutMapping("/tags/{id}")
    public ResponseEntity<ResponseTagDTO> updateTag(@PathVariable Long id, @Valid @RequestBody UpdateTagDTO updateTagDTO) {
        log.info("Admin updating tag with id {}: {}", id, updateTagDTO);
        return ResponseEntity.ok(catalogService.updateTag(id, updateTagDTO));
    }

    @DeleteMapping("/tags/{id}")
    public ResponseEntity<Void> deleteTag(@PathVariable Long id) {
        log.info("Admin deleting tag with id: {}", id);
        catalogService.deleteTagById(id);
        return ResponseEntity.noContent().build();
    }

    // === COMBINED ===

    @GetMapping("/all-products-and-mixtures")
    public List<ResponseCatalogItemDTO> getAllProductsAndMixtures() {
        log.info("Admin fetching all products and mixtures");
        return catalogService.getAllProductsAndMixtures();
    }

    // === SEARCH ===

    @GetMapping("/search")
    public ResponseSearchResultDTO search(@RequestParam("q") String query) {
        log.info("Search query: {}", query);
        return elasticsearchService.search(query);
    }

    @GetMapping("/index-all")
    @ResponseStatus(HttpStatus.OK)
    public void indexAll() {
        log.info("Indexing all catalog items");
        elasticsearchService.indexAll(getAllCategories(), getAllProducts(), getAllMixtures(), getAllTags());
    }
}
