package com.dvoracekmartin.catalogservice.web.controller.v1;

import com.dvoracekmartin.catalogservice.application.dto.category.CreateCategoryDTO;
import com.dvoracekmartin.catalogservice.application.dto.category.UpdateCategoryDTO;
import com.dvoracekmartin.catalogservice.application.dto.mixture.CreateMixtureDTO;
import com.dvoracekmartin.catalogservice.application.dto.mixture.UpdateMixtureDTO;
import com.dvoracekmartin.catalogservice.application.dto.product.CreateProductDTO;
import com.dvoracekmartin.catalogservice.application.dto.product.UpdateProductDTO;
import com.dvoracekmartin.catalogservice.application.dto.product.UpdateProductStockDTO;
import com.dvoracekmartin.catalogservice.application.dto.search.ResponseSearchResultDTO;
import com.dvoracekmartin.catalogservice.application.dto.tag.CreateTagDTO;
import com.dvoracekmartin.catalogservice.application.dto.tag.UpdateTagDTO;
import com.dvoracekmartin.catalogservice.application.elasticsearch.service.ElasticsearchServiceImpl;
import com.dvoracekmartin.catalogservice.application.service.CatalogService;
import com.dvoracekmartin.common.dto.category.ResponseCategoryDTO;
import com.dvoracekmartin.common.dto.mixture.ResponseMixtureDTO;
import com.dvoracekmartin.common.dto.product.ResponseProductDTO;
import com.dvoracekmartin.common.dto.tag.ResponseTagDTO;
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
@RequestMapping("/api/catalog/v1/admin")
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
        return catalogService.getAllProducts();
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<ResponseProductDTO> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(catalogService.getProductById(id));
    }

    @PostMapping("/products")
    public ResponseEntity<ResponseProductDTO> createProduct(@Valid @RequestBody CreateProductDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(catalogService.createProduct(dto));
    }

    @PutMapping("/products/{id}")
    public ResponseEntity<ResponseProductDTO> updateProduct(@PathVariable Long id, @Valid @RequestBody UpdateProductDTO dto) {
        return ResponseEntity.ok(catalogService.updateProduct(id, dto));
    }

    @PutMapping("/products/{id}/stock")
    public ResponseEntity<ResponseProductStockEvent> updateProductStock(@PathVariable Long id, @Valid @RequestBody UpdateProductStockDTO dto) {
        return ResponseEntity.ok(catalogService.updateProductStockDTO(id, dto));
    }

    @GetMapping("/products/{id}/stock")
    public ResponseEntity<ResponseProductStockEvent> getProductStock(@PathVariable Long id) {
        ResponseProductStockEvent stock = catalogService.getProductStock(id);
        return stock != null ? ResponseEntity.ok(stock) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        catalogService.deleteProductById(id);
        return ResponseEntity.noContent().build();
    }

    // === MIXTURES ===

    @GetMapping("/all-mixtures")
    public List<ResponseMixtureDTO> getAllMixtures() {
        return catalogService.getAllMixtures();
    }

    @GetMapping("/mixtures/{id}")
    public ResponseEntity<ResponseMixtureDTO> getMixtureById(@PathVariable Long id) {
        return ResponseEntity.ok(catalogService.getMixtureById(id));
    }

    @PostMapping("/mixtures")
    public ResponseEntity<ResponseMixtureDTO> createMixture(@Valid @RequestBody CreateMixtureDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(catalogService.createMixture(dto));
    }

    @PutMapping("/mixtures/{id}")
    public ResponseEntity<ResponseMixtureDTO> updateMixture(@PathVariable Long id, @Valid @RequestBody UpdateMixtureDTO dto) {
        return ResponseEntity.ok(catalogService.updateMixture(id, dto));
    }

    @DeleteMapping("/mixtures/{id}")
    public ResponseEntity<Void> deleteMixture(@PathVariable Long id) {
        catalogService.deleteMixtureById(id);
        return ResponseEntity.noContent().build();
    }

    // === CATEGORIES ===

    @GetMapping("/all-categories")
    public List<ResponseCategoryDTO> getAllCategories() {
        return catalogService.getAllCategories();
    }

    @GetMapping("/categories/{id}")
    public ResponseEntity<ResponseCategoryDTO> getCategoryById(@PathVariable Long id) {
        return ResponseEntity.ok(catalogService.getCategoryById(id));
    }

    @PostMapping("/categories")
    public ResponseEntity<ResponseCategoryDTO> createCategory(@Valid @RequestBody CreateCategoryDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(catalogService.createCategory(dto));
    }

    @PutMapping("/categories/{id}")
    public ResponseEntity<ResponseCategoryDTO> updateCategory(@PathVariable Long id, @Valid @RequestBody UpdateCategoryDTO dto) {
        return ResponseEntity.ok(catalogService.updateCategory(id, dto));
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        catalogService.deleteCategoryById(id);
        return ResponseEntity.noContent().build();
    }

    // === TAGS ===

    @GetMapping("/all-tags")
    public List<ResponseTagDTO> getAllTags() {
        return catalogService.getAllTags();
    }

    @GetMapping("/tags/{id}")
    public ResponseEntity<ResponseTagDTO> getTagById(@PathVariable Long id) {
        return ResponseEntity.ok(catalogService.getTagById(id));
    }

    @PostMapping("/tags")
    public ResponseEntity<ResponseTagDTO> createTag(@Valid @RequestBody CreateTagDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(catalogService.createTag(dto));
    }

    @PutMapping("/tags/{id}")
    public ResponseEntity<ResponseTagDTO> updateTag(@PathVariable Long id, @Valid @RequestBody UpdateTagDTO dto) {
        return ResponseEntity.ok(catalogService.updateTag(id, dto));
    }

    @DeleteMapping("/tags/{id}")
    public ResponseEntity<Void> deleteTag(@PathVariable Long id) {
        catalogService.deleteTagById(id);
        return ResponseEntity.noContent().build();
    }

    // === SEARCH / INDEX ===

    @GetMapping("/search")
    public ResponseSearchResultDTO search(@RequestParam("q") String query) {
        return elasticsearchService.search(query);
    }

    @PostMapping("/index-all")
    @ResponseStatus(HttpStatus.OK)
    public void indexAll() {
        elasticsearchService.indexAll(
                catalogService.getAllCategories(),
                catalogService.getAllProducts(),
                catalogService.getAllMixtures(),
                catalogService.getAllTags()
        );
    }
}
