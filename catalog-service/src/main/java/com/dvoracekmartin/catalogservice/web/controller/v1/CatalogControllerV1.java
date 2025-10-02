package com.dvoracekmartin.catalogservice.web.controller.v1;

import com.dvoracekmartin.catalogservice.application.dto.mixture.CreateMixtureDTO;
import com.dvoracekmartin.catalogservice.application.dto.search.ResponseSearchResultDTO;
import com.dvoracekmartin.catalogservice.application.elasticsearch.service.ElasticsearchServiceImpl;
import com.dvoracekmartin.catalogservice.application.service.CatalogService;
import com.dvoracekmartin.catalogservice.application.service.media.MediaRetriever;
import com.dvoracekmartin.catalogservice.config.RateLimit;
import com.dvoracekmartin.common.dto.category.ResponseCategoryDTO;
import com.dvoracekmartin.common.dto.mixture.ResponseMixtureDTO;
import com.dvoracekmartin.common.dto.product.ResponseProductDTO;
import com.dvoracekmartin.common.dto.tag.ResponseTagDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/catalog/v1")
@Validated
@RequiredArgsConstructor
@Slf4j
public class CatalogControllerV1 {

    private final CatalogService catalogService;
    private final MediaRetriever mediaRetriever;
    private final ElasticsearchServiceImpl elasticsearchService;

    // === MEDIA ===

    @GetMapping("/media")
    public ResponseEntity<byte[]> getMedia(@RequestParam String objectKey, @RequestParam String bucketName) {
        byte[] mediaData = mediaRetriever.retrieveMedia(objectKey, bucketName);
        if (mediaData == null) {
            log.error("Media not found: {}", objectKey);
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok().contentType(MediaType.IMAGE_JPEG).body(mediaData);
    }

    @GetMapping("/media/list")
    public List<ResponseEntity<byte[]>> listMedia(@RequestParam String folder, @RequestParam String bucketName) {
        return mediaRetriever.listMediaKeysInFolder(folder, bucketName).stream()
                .map(key -> {
                    byte[] data = mediaRetriever.retrieveMedia(key, bucketName);
                    if (data != null) {
                        return ResponseEntity.ok().contentType(MediaType.IMAGE_JPEG).body(data);
                    }
                    log.error("Media not found: {}", key);
                    return null;
                })
                .filter(resp -> resp != null)
                .toList();
    }

    @GetMapping("/media/list-names")
    public List<String> listMediaNames(@RequestParam String folder, @RequestParam String bucketName) {
        return mediaRetriever.listMediaKeysInFolder(folder, bucketName);
    }

    // === PRODUCTS ===

    @GetMapping("/all-products")
    public List<ResponseProductDTO> getAllProducts() {
        return catalogService.getAllProducts();
    }

    @GetMapping("/all-products-by-category-id/{categoryId}")
    public List<ResponseProductDTO> getAllProductsByCategory(@PathVariable Long categoryId) {
        return catalogService.getAllProductsByCategoryId(categoryId);
    }

    @GetMapping("/active-products-by-category-id/{categoryId}")
    public List<ResponseProductDTO> getActiveProductsByCategory(@PathVariable Long categoryId) {
        return catalogService.getActiveProductsByCategoryId(categoryId);
    }

    @GetMapping("/active-products-for-mixing-by-category-id/{categoryId}")
    public List<ResponseProductDTO> getActiveProductsForMixing(@PathVariable Long categoryId) {
        return catalogService.getActiveProductsForMixingByCategoryId(categoryId);
    }

    @GetMapping("/active-products-for-display-in-products")
    public List<ResponseProductDTO> getActiveProductsForDisplay() {
        return catalogService.getActiveProductsForDisplayInProducts();
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<ResponseProductDTO> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(catalogService.getProductById(id));
    }

    // === MIXTURES ===

    @GetMapping("/all-mixtures")
    public List<ResponseMixtureDTO> getAllMixtures() {
        return catalogService.getAllMixtures();
    }

    @GetMapping("/active-mixtures-for-display-in-products")
    public List<ResponseMixtureDTO> getActiveMixturesForDisplay() {
        return catalogService.getActiveMixturesForDisplayInProducts();
    }

    @PostMapping("/mixtures")
    public ResponseEntity<ResponseMixtureDTO> createMixture(@Valid @RequestBody CreateMixtureDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(catalogService.createMixture(dto));
    }

    @GetMapping("/mixtures/{id}")
    public ResponseEntity<ResponseMixtureDTO> getMixtureById(@PathVariable Long id) {
        return ResponseEntity.ok(catalogService.getMixtureById(id));
    }

    // === CATEGORIES ===

    @GetMapping("/all-categories")
    public List<ResponseCategoryDTO> getAllCategories() {
        return catalogService.getAllCategories();
    }

    @GetMapping("/active-categories")
    public List<ResponseCategoryDTO> getActiveCategories() {
        return catalogService.getActiveCategories();
    }

    @GetMapping("/active-categories-for-mixing")
    public List<ResponseCategoryDTO> getActiveCategoriesForMixing() {
        return catalogService.getActiveCategoriesForMixing();
    }

    @GetMapping("/categories/{id}")
    public ResponseEntity<ResponseCategoryDTO> getCategoryById(@PathVariable Long id) {
        return ResponseEntity.ok(catalogService.getCategoryById(id));
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

    // === SEARCH ===

    @RateLimit(limit = 100, durationInSeconds = 15)
    @GetMapping("/search")
    public ResponseSearchResultDTO search(@RequestParam("q") String query) {
        return elasticsearchService.searchProductsAndMixtures(query);
    }
}
