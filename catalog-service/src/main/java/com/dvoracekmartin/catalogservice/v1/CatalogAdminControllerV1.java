package com.dvoracekmartin.catalogservice.v1;

import com.dvoracekmartin.catalogservice.application.dto.*;
import com.dvoracekmartin.catalogservice.application.service.CatalogService;
import com.dvoracekmartin.catalogservice.domain.service.MinIOMediaUploader;
import com.dvoracekmartin.common.event.ResponseProductStockEvent;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/catalog/v1/admin/")
@PreAuthorize("hasRole('user_admin')")
@Validated
@RequiredArgsConstructor
@Slf4j
public class CatalogAdminControllerV1 {

    private final CatalogService catalogService;
    private final MinIOMediaUploader mediaUploader;

    @PostMapping("/media/upload-images")
    public ResponseEntity<List<MediaUploadResponseDTO>> uploadImages(
            @Valid @RequestBody List<MediaUploadRequestDTO> requests) {

        List<MediaUploadResponseDTO> responses = new ArrayList<>();

        for (MediaUploadRequestDTO request : requests) {
            if (!request.contentType().startsWith("image/")) {
                responses.add(new MediaUploadResponseDTO(
                        "error",
                        null,
                        "Invalid content type for image upload: " + request.contentType()
                ));
                continue;
            }

            try {
                String url = mediaUploader.uploadBase64Image(
                        request.base64Data(),
                        request.objectKey(),
                        request.contentType()
                );

                responses.add(new MediaUploadResponseDTO(
                        "success",
                        url,
                        "Upload successful"
                ));

            } catch (Exception e) {
                log.error("Failed to upload image: {}", e.getMessage());
                responses.add(new MediaUploadResponseDTO(
                        "error",
                        null,
                        "Upload failed: " + e.getMessage()
                ));
            }
        }

        return ResponseEntity.status(HttpStatus.MULTI_STATUS).body(responses);
    }

    @PostMapping("/media/upload-image")
    public ResponseEntity<String> uploadImage(@Valid @RequestBody MediaUploadRequestDTO request) {
        if (!request.contentType().startsWith("image/")) {
            log.error("Invalid content type for image upload: {}", request.contentType());
            return ResponseEntity.badRequest().body("Content type must be an image");
        }

        String url = mediaUploader.uploadBase64Image(
                request.base64Data(),
                request.objectKey(),
                request.contentType()
        );

        if (url != null) {
            log.info("Image uploaded successfully to: {}", url);
            return ResponseEntity.ok(url);
        } else {
            log.error("Failed to upload image with key: {}", request.objectKey());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/media/upload-video")
    public ResponseEntity<String> uploadVideo(@Valid @RequestBody MediaUploadRequestDTO request) {
        if (!request.contentType().startsWith("video/")) {
            log.error("Invalid content type for video upload: {}", request.contentType());
            return ResponseEntity.badRequest().body("Content type must be a video");
        }

        String url = mediaUploader.uploadBase64Video(
                request.base64Data(),
                request.objectKey(),
                request.contentType()
        );

        if (url != null) {
            log.info("Video uploaded successfully to: {}", url);
            return ResponseEntity.ok(url);
        } else {
            log.error("Failed to upload video with key: {}", request.objectKey());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    
    @GetMapping("/all-products-and-mixtures")
    public List<ResponseCatalogItemDTO> getAllProductsAndMixtures() {
        log.info("Admin fetching all products and mixtures");
        return catalogService.getAllProductsAndMixtures();
    }

    @GetMapping("/all-products")
    public List<ResponseProductDTO> getAllProducts() {
        log.info("Admin fetching all products");
        return catalogService.getAllProducts();
    }

    @GetMapping("/all-mixtures")
    public List<ResponseMixtureDTO> getAllMixtures() {
        log.info("Admin fetching all mixtures");
        return catalogService.getAllMixtures();
    }

    @GetMapping("/all-categories")
    public List<ResponseCategoryDTO> getAllCategories() {
        log.info("Admin fetching all categories");
        return catalogService.getAllCategories();
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<ResponseProductDTO> getProductById(@PathVariable Long id) {
        log.info("Admin fetching product by id: {}", id);
        return ResponseEntity.ok(catalogService.getProductById(id));
    }

    @GetMapping("/mixtures/{id}")
    public ResponseEntity<ResponseMixtureDTO> getMixtureById(@PathVariable Long id) {
        log.info("Admin fetching mixture by id: {}", id);
        return ResponseEntity.ok(catalogService.getMixtureById(id));
    }

    @GetMapping("/categories/{id}")
    public ResponseEntity<ResponseCategoryDTO> getCategoryById(@PathVariable Long id) {
        log.info("Admin fetching category by id: {}", id);
        return ResponseEntity.ok(catalogService.getCategoryById(id));
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

    @DeleteMapping("/products/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        log.info("Admin deleting product with id: {}", id);
        catalogService.deleteProductById(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/mixtures/{id}")
    public ResponseEntity<Void> deleteMixture(@PathVariable Long id) {
        log.info("Admin deleting mixture with id: {}", id);
        catalogService.deleteMixtureById(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        log.info("Admin deleting category with id: {}", id);
        catalogService.deleteCategoryById(id);
        return ResponseEntity.noContent().build();
    }
}
