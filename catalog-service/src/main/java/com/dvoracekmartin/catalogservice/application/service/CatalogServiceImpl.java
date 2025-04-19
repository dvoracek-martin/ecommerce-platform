package com.dvoracekmartin.catalogservice.application.service;

import com.dvoracekmartin.catalogservice.application.dto.*;
import com.dvoracekmartin.catalogservice.application.event.publisher.CatalogEventPublisher;
import com.dvoracekmartin.catalogservice.application.service.media.MediaRetriever;
import com.dvoracekmartin.catalogservice.application.service.media.MediaUploader;
import com.dvoracekmartin.catalogservice.domain.model.Category;
import com.dvoracekmartin.catalogservice.domain.model.Mixture;
import com.dvoracekmartin.catalogservice.domain.model.Product;
import com.dvoracekmartin.catalogservice.domain.model.Tag;
import com.dvoracekmartin.catalogservice.domain.repository.CategoryRepository;
import com.dvoracekmartin.catalogservice.domain.repository.MixtureRepository;
import com.dvoracekmartin.catalogservice.domain.repository.ProductRepository;
import com.dvoracekmartin.catalogservice.domain.service.CatalogDomainService;
import com.dvoracekmartin.common.event.ResponseProductStockEvent;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.common.errors.ResourceNotFoundException;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

import static java.util.Objects.nonNull;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class CatalogServiceImpl implements CatalogService {

    private static final String CATEGORY_BUCKET = "categories";
    private static final String PRODUCT_BUCKET = "products";
    private static final String MIXTURE_BUCKET = "mixtures";
    private final CatalogEventPublisher catalogEventPublisher;
    private final ProductRepository productRepository;
    private final MixtureRepository mixtureRepository;
    private final CategoryRepository categoryRepository;
    private final CatalogMapper catalogMapper;
    private final CatalogDomainService catalogDomainService;
    private final MediaUploader mediaUploader;
    private final MediaRetriever mediaRetriever;

    @Override
    public List<ResponseProductDTO> getAllProducts() {
        log.info("Fetching all products");
        return productRepository.findAll().stream().map(product -> catalogMapper.mapProductToResponseProductDTO(product)).toList();
    }

    @Override
    public List<ResponseMixtureDTO> getAllMixtures() {
        log.info("Fetching all mixtures");
        return mixtureRepository.findAll().stream().map(catalogMapper::mapMixtureToResponseMixtureDTO).toList();
    }

    @Override
    public List<ResponseCatalogItemDTO> getAllProductsAndMixtures() {
        log.info("Fetching all products and mixtures");
        List<ResponseCatalogItemDTO> products = new ArrayList<>(productRepository.findAll().stream().map(catalogMapper::mapProductToResponseCatalogItemDTO).toList());

        List<ResponseCatalogItemDTO> mixtures = mixtureRepository.findAll().stream().map(catalogMapper::mapMixtureToResponseCatalogItemDTO).toList();

        products.addAll(mixtures);
        return products;
    }

    @Override
    public List<ResponseCategoryDTO> getAllCategories() {
        log.info("Fetching all categories with media");
        return categoryRepository.findAll().stream().map(category -> {
            // 1) List all object keys in the folder named after the category
            List<String> keys = mediaRetriever.listMediaKeysInFolder(category.getName().replaceAll("\\s", "-"), CATEGORY_BUCKET);

            // 2) For each key, download bytes, encode to Base64, and derive a contentType
            List<ResponseMediaDTO> mediaDTOs = keys.stream().map(key -> {
                byte[] data = mediaRetriever.retrieveMedia(key, CATEGORY_BUCKET);
                String base64 = data != null ? Base64.getEncoder().encodeToString(data) : null;
                String contentType = deriveContentTypeFromKey(key);
                return new ResponseMediaDTO(base64, key, contentType);
            }).toList();

            // 3) Build the full DTO
            return new ResponseCategoryDTO(category.getId(), category.getName(), category.getDescription(), category.getCategoryType(), mediaDTOs, category.getTags().stream().map(Tag::getName).toList());
        }).toList();
    }

    @Override
    public List<ResponseProductDTO> createProduct(@Valid List<CreateProductDTO> createProductDTOList) {
        log.info("Creating products: {}", createProductDTOList);
        createProductDTOList.stream().filter(dto -> !categoryRepository.existsByName(dto.name())).collect(Collectors.collectingAndThen(Collectors.toList(), list -> {
            if (list.isEmpty()) {
                throw new IllegalArgumentException("All products already exist!");
            }
            return list;
        }));

        return createProductDTOList.stream().filter(dto -> !productRepository.existsByName(dto.name())).map(createProductDTO -> {
            // Process media uploads and collect image URLs
            List<String> imageUrls = new ArrayList<>();
            List<ResponseMediaDTO> responseMedia = new ArrayList<>();
            if (createProductDTO.uploadMediaDTOs() != null) {
                for (UploadMediaDTO media : createProductDTO.uploadMediaDTOs()) {

                    // Upload media and get public URL
                    String publicUrl = mediaUploader.uploadBase64(media.base64Data(), createProductDTO.name(), media.objectKey(), media.contentType(), PRODUCT_BUCKET, createProductDTO.name());
                    if (publicUrl != null) {
                        imageUrls.add(publicUrl);
                    }

                    Category category = categoryRepository.findById(createProductDTO.categoryId()).orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + createProductDTO.categoryId()));
                    // Store original base64 data for response
                    responseMedia.add(new ResponseMediaDTO(media.base64Data(), category.getCategoryType(), media.contentType()));
                }
            }

            // Create and save category
            Product product = new Product();
            product.setName(createProductDTO.name());
            product.setDescription(createProductDTO.description());
            product.setCategory(categoryRepository.findById(createProductDTO.categoryId()).orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + createProductDTO.categoryId())));
            product.setImages(imageUrls);

            Product savedProduct = productRepository.save(product);

            // Build response with original base64 data
            return catalogMapper.mapProductToResponseProductDTO(savedProduct, responseMedia);
        }).collect(Collectors.toList());
    }

    @Override
    public ResponseProductDTO updateProduct(Long id, UpdateProductDTO updateProductDTO) {
        log.info("Updating product with id {}: {}", id, updateProductDTO);

        // Get existing product
        Product existingProduct = productRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        // Validate name uniqueness if changing
        if (updateProductDTO.name() != null && !updateProductDTO.name().equals(existingProduct.getName())) {
            if (productRepository.existsByName(updateProductDTO.name())) {
                throw new IllegalArgumentException("Product name already exists: " + updateProductDTO.name());
            }
        }

        // Process media uploads
        List<String> imageUrls = new ArrayList<>();
        List<ResponseMediaDTO> responseMedia = new ArrayList<>();
        if (updateProductDTO.uploadMediaDTOs() != null) {
            for (UploadMediaDTO media : updateProductDTO.uploadMediaDTOs()) {
                String publicUrl = mediaUploader.uploadBase64(media.base64Data(), updateProductDTO.name() != null ? updateProductDTO.name() : existingProduct.getName(), media.objectKey(), media.contentType(), PRODUCT_BUCKET, updateProductDTO.name() != null ? updateProductDTO.name() : existingProduct.getName());
                if (publicUrl != null) {
                    imageUrls.add(publicUrl);
                }

                // Get category for media response
                Category category = updateProductDTO.categoryId() != null ? categoryRepository.findById(updateProductDTO.categoryId()).orElse(existingProduct.getCategory()) : existingProduct.getCategory();

                responseMedia.add(new ResponseMediaDTO(media.base64Data(), category != null ? category.getCategoryType() : null, media.contentType()));
            }
        }

        // Update category if provided
        if (updateProductDTO.categoryId() != null) {
            Category category = categoryRepository.findById(updateProductDTO.categoryId()).orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + updateProductDTO.categoryId()));
            existingProduct.setCategory(category);
        }

        // Merge images (keep existing if no new uploads)
        if (!imageUrls.isEmpty()) {
            existingProduct.setImages(imageUrls);
        }

        // Save updated product
        Product savedProduct = productRepository.save(existingProduct);

        // Build response
        ResponseProductDTO responseDTO = catalogMapper.mapProductToResponseProductDTO(savedProduct, responseMedia);
        return responseDTO;
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
        return mixtureRepository.saveAll(createMixtureDTOList.stream().map(catalogMapper::mapCreateMixtureDTOToMixture).toList()).stream().map(catalogMapper::mapMixtureToResponseMixtureDTO).toList();
    }

    @Override
    public ResponseMixtureDTO updateMixture(Long id, UpdateMixtureDTO updateMixtureDTO) {
        log.info("Updating mixture with id {}: {}", id, updateMixtureDTO);
        Mixture existingMixture = mixtureRepository.findById(id).orElseThrow(() -> new RuntimeException("Mixture not found with id: " + id));

        catalogMapper.mapUpdateMixtureDTOToMixture(updateMixtureDTO);

        return catalogMapper.mapMixtureToResponseMixtureDTO(mixtureRepository.save(existingMixture));
    }

    @Override
    public List<ResponseCategoryDTO> createCategory(@Valid List<CreateCategoryDTO> createCategoryDTOList) {
        log.info("Creating categories: {}", createCategoryDTOList);
        createCategoryDTOList.stream().filter(dto -> !categoryRepository.existsByName(dto.name())).collect(Collectors.collectingAndThen(Collectors.toList(), list -> {
            if (list.isEmpty()) {
                throw new IllegalArgumentException("All categories already exist!");
            }
            return list;
        }));
        return createCategoryDTOList.stream().filter(dto -> !categoryRepository.existsByName(dto.name())).map(createCategoryDTO -> {
            // Process media uploads and collect image URLs
            List<String> imageUrls = new ArrayList<>();
            List<ResponseMediaDTO> responseMedia = new ArrayList<>();
            if (createCategoryDTO.uploadMediaDTOs() != null) {
                for (UploadMediaDTO media : createCategoryDTO.uploadMediaDTOs()) {

                    // Upload media and get public URL
                    String publicUrl = mediaUploader.uploadBase64(media.base64Data(), createCategoryDTO.name(), media.objectKey(), media.contentType(), CATEGORY_BUCKET, createCategoryDTO.name());
                    if (publicUrl != null) {
                        imageUrls.add(publicUrl);
                    }
                    // Store original base64 data for response
                    responseMedia.add(new ResponseMediaDTO(media.base64Data(), createCategoryDTO.categoryType(), media.contentType()));
                }
            }

            // Create and save category
            Category category = new Category();
            category.setName(createCategoryDTO.name());
            category.setDescription(createCategoryDTO.description());
            category.setCategoryType(createCategoryDTO.categoryType());
            category.setImages(imageUrls);

            Category savedCategory = categoryRepository.save(category);

            // Build response with original base64 data
            return new ResponseCategoryDTO(savedCategory.getId(), savedCategory.getName(), savedCategory.getDescription(), savedCategory.getCategoryType(), responseMedia, category.getTags() == null ? null : category.getTags().stream().map(Tag::getName).toList());
        }).collect(Collectors.toList());
    }

    @Override
    public ResponseCategoryDTO updateCategory(Long id, UpdateCategoryDTO updateCategoryDTO) {
        log.info("Updating category with id {}: {}", id, updateCategoryDTO);
        Category existingCategory = categoryRepository.findById(id).orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
        categoryRepository.findByName(updateCategoryDTO.name())
                .ifPresent(existingCategoryByName -> {
                    if (!existingCategoryByName.getId().equals(id)) {
                        throw new ResponseStatusException(HttpStatus.CONFLICT, "Category name already exists: " + updateCategoryDTO.name());
                    }
                });

        // Remove old media
        for (String imageUrl : existingCategory.getImages()) {
            mediaUploader.deleteMedia(imageUrl);
        }

        // Process media uploads and collect results
        List<String> newImageUrls = new ArrayList<>();
        List<ResponseMediaDTO> responseMedia = new ArrayList<>();
        if (updateCategoryDTO.uploadMediaDTOs() != null) {
            for (UploadMediaDTO media : updateCategoryDTO.uploadMediaDTOs()) {

                // Upload media and get public URL
                String publicUrl = mediaUploader.uploadBase64(media.base64Data(), updateCategoryDTO.name(), media.objectKey(), media.contentType(), CATEGORY_BUCKET, updateCategoryDTO.name());

                if (publicUrl != null) {
                    newImageUrls.add(publicUrl);
                }

                // Store original base64 data for response
                responseMedia.add(new ResponseMediaDTO(media.base64Data(), updateCategoryDTO.categoryType(), media.contentType()));
            }
        }

        // Update existing category
        existingCategory.setName(updateCategoryDTO.name());
        existingCategory.setCategoryType(updateCategoryDTO.categoryType());
        existingCategory.setDescription(updateCategoryDTO.description());
        existingCategory.getImages().addAll(newImageUrls);
        Category savedCategory = categoryRepository.save(existingCategory);

        // Build response with updated data and new media
        return new ResponseCategoryDTO(savedCategory.getId(), savedCategory.getName(), savedCategory.getDescription(), savedCategory.getCategoryType(), responseMedia, savedCategory.getTags().stream().map(Tag::getName).toList());
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
        log.info("Fetching category with id {} including media", id);
        Category category = categoryRepository.findById(id).orElseThrow(() -> new RuntimeException("Category not found with id: " + id));

        // 1) List all object keys in the folder named after the category
        List<String> keys = mediaRetriever.listMediaKeysInFolder(category.getName().replaceAll("\\s", "-"), CATEGORY_BUCKET);

        // 2) For each key, download bytes, encode to Base64, and derive a contentType
        List<ResponseMediaDTO> mediaDTOs = keys.stream().map(key -> {
            byte[] data = mediaRetriever.retrieveMedia(key, CATEGORY_BUCKET);
            String base64 = data != null ? Base64.getEncoder().encodeToString(data) : null;
            String contentType = deriveContentTypeFromKey(key);
            return new ResponseMediaDTO(base64, key, contentType);
        }).toList();

        // 3) Build the full DTO
        return new ResponseCategoryDTO(category.getId(), category.getName(), category.getDescription(), category.getCategoryType(), mediaDTOs, category.getTags().stream().map(Tag::getName).toList());
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
        Optional<Category> category = categoryRepository.findById(id);
        if (category.isPresent()) {
            // Delete associated media files
            for (String imageUrl : category.get().getImages()) {
                mediaUploader.deleteMedia(imageUrl);
            }
        }
        categoryRepository.deleteById(id);
    }

    private <T, R> R getEntityById(Long id, Function<Long, java.util.Optional<T>> findById, Function<T, R> mapper, String entityName) {
        log.info("Fetching {} with id: {}", entityName, id);
        return findById.apply(id).map(mapper).orElseThrow(() -> new RuntimeException(entityName + " not found with id: " + id));
    }

    /**
     * Simple helper to guess a MIME type from the file extension
     */
    private String deriveContentTypeFromKey(String key) {
        if (key.endsWith(".png")) return "image/png";
        if (key.endsWith(".jpg") || key.endsWith(".jpeg")) return "image/jpeg";
        if (key.endsWith(".gif")) return "image/gif";
        if (key.endsWith(".mp4")) return "video/mp4";
        // …add more as you need…
        return "application/octet-stream";
    }
}
