package com.dvoracekmartin.catalogservice.application.service;

import com.dvoracekmartin.catalogservice.application.dto.category.CreateCategoryDTO;
import com.dvoracekmartin.catalogservice.application.dto.category.ResponseCategoryDTO;
import com.dvoracekmartin.catalogservice.application.dto.category.UpdateCategoryDTO;
import com.dvoracekmartin.catalogservice.application.dto.media.MediaDTO;
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
import com.dvoracekmartin.catalogservice.application.dto.utils.CatalogMapper;
import com.dvoracekmartin.catalogservice.application.elasticsearch.service.ElasticsearchService;
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
import com.dvoracekmartin.catalogservice.domain.repository.TagRepository;
import com.dvoracekmartin.catalogservice.domain.service.CatalogDomainService;
import com.dvoracekmartin.catalogservice.domain.utils.BucketName;
import com.dvoracekmartin.common.event.ResponseProductStockEvent;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.common.errors.ResourceNotFoundException;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.stream.Collectors;

import static java.util.Objects.nonNull;
import static java.util.stream.Collectors.toList;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class CatalogServiceImpl implements CatalogService {

    private final CatalogEventPublisher catalogEventPublisher;
    private final ProductRepository productRepository;
    private final MixtureRepository mixtureRepository;
    private final CategoryRepository categoryRepository;
    private final TagRepository tagRepository;
    private final CatalogMapper catalogMapper;
    private final CatalogDomainService catalogDomainService;
    private final MediaUploader mediaUploader;
    private final MediaRetriever mediaRetriever;
    private final ElasticsearchService elasticsearchService;


    @Override
    public List<ResponseProductDTO> getAllProducts() {
        mediaUploader.createBucketIfNotExists(BucketName.PRODUCTS.getName());
        log.info("Fetching all products with media");
        return productRepository.findAll().stream()
                .map(product -> {
                    // 1) List all object keys in the folder named after the product ID
                    List<String> keys = mediaRetriever.listMediaKeysInFolder(product.getName().replaceAll("\\s", "-"), BucketName.PRODUCTS.getName());

                    List<MediaDTO> mediaDTOs = keys.stream().map(key -> {
                        byte[] data = mediaRetriever.retrieveMedia(key, BucketName.PRODUCTS.getName());
                        String base64 = data != null ? Base64.getEncoder().encodeToString(data) : null;
                        String contentType = deriveContentTypeFromKey(key);
                        return new MediaDTO(base64, key, contentType);
                    }).toList();

                    return new ResponseProductDTO(product.getId(), product.getName(), product.getDescription(), product.getPriority(), product.isActive(), mediaDTOs, product.getTags().stream().map(catalogMapper::mapTagToResponseTagDTO).toList(), product.getCategory().getId(), product.getPrice(), product.getWeightGrams());
                })
                .sorted(Comparator.comparingInt(ResponseProductDTO::getPriority).thenComparingLong(ResponseProductDTO::getId))
                .toList();
    }

    @Override
    public List<ResponseProductDTO> getAllProductsByCategoryId(Long categoryId) {
        mediaUploader.createBucketIfNotExists(BucketName.PRODUCTS.getName());
        log.info("Fetching all products with media by CategoryId");
        return productRepository.findAllByCategoryId(categoryId).stream()
                .map(product -> {
                    // 1) List all object keys in the folder named after the product ID
                    List<String> keys = mediaRetriever.listMediaKeysInFolder(product.getName().replaceAll("\\s", "-"), BucketName.PRODUCTS.getName());

                    List<MediaDTO> mediaDTOs = keys.stream().map(key -> {
                        byte[] data = mediaRetriever.retrieveMedia(key, BucketName.PRODUCTS.getName());
                        String base64 = data != null ? Base64.getEncoder().encodeToString(data) : null;
                        String contentType = deriveContentTypeFromKey(key);
                        return new MediaDTO(base64, key, contentType);
                    }).toList();

                    return new ResponseProductDTO(product.getId(), product.getName(), product.getDescription(), product.getPriority(), product.isActive(), mediaDTOs, product.getTags().stream().map(catalogMapper::mapTagToResponseTagDTO).toList(), product.getCategory().getId(), product.getPrice(), product.getWeightGrams());
                })
                .sorted(Comparator.comparingInt(ResponseProductDTO::getPriority).thenComparingLong(ResponseProductDTO::getId))
                .toList();
    }

    @Override
    public List<ResponseMixtureDTO> getAllMixtures() {
        log.info("Fetching all mixtures");
        mediaUploader.createBucketIfNotExists(BucketName.MIXTURES.getName());
        return mixtureRepository.findAll().stream()
                .map(mixture -> {
                    List<String> keys = mediaRetriever.listMediaKeysInFolder(mixture.getName().replaceAll("\\s", "-"), BucketName.MIXTURES.getName());
                    List<MediaDTO> mediaDTOs = keys.stream().map(key -> {
                        byte[] data = mediaRetriever.retrieveMedia(key, BucketName.MIXTURES.getName());
                        String base64 = data != null ? Base64.getEncoder().encodeToString(data) : null;
                        String contentType = deriveContentTypeFromKey(key);
                        return new MediaDTO(base64, key, contentType);
                    }).toList();
                    return new ResponseMixtureDTO(
                            mixture.getId(),
                            mixture.getName(),
                            mixture.getDescription(),
                            mixture.getPriority(),
                            mixture.isActive(),
                            mediaDTOs,
                            mixture.getCategories().get(0).getId(), // Assuming one category per mixture
                            mixture.getProducts().stream().map(catalogMapper::mapProductToResponseProductDTO).toList(),
                            mixture.getTags().stream().map(Tag::getId).toList(),
                            mixture.getPrice(),
                            mixture.getWeightGrams()
                    );
                })
                .sorted(Comparator.comparingInt(ResponseMixtureDTO::getPriority).thenComparingLong(ResponseMixtureDTO::getId))
                .toList();
    }

//    @Override
//    public List<ResponseCatalogItemDTO> getAllProductsAndMixtures() {
//        log.info("Fetching all products and mixtures");
//        List<ResponseCatalogItemDTO> products = new ArrayList<>(productRepository.findAll().stream().map(catalogMapper::mapProductToResponseCatalogItemDTO).toList());
//
//        List<ResponseCatalogItemDTO> mixtures = mixtureRepository.findAll().stream().map(catalogMapper::mapMixtureToResponseCatalogItemDTO).toList();
//
//        products.addAll(mixtures);
//        return products.stream()
//                .sorted(Comparator.comparingInt(ResponseCatalogItemDTO::getPriority).thenComparingLong(ResponseCatalogItemDTO::getId))
//                .collect(Collectors.toList());
//    }

    @Override
    public List<ResponseCategoryDTO> getAllCategories() {
        log.info("Fetching all categories with media");
        mediaUploader.createBucketIfNotExists(BucketName.CATEGORIES.getName());
        return categoryRepository.findAll().stream().map(category -> {
                    // 1) List all object keys in the folder named after the category
                    List<String> keys = mediaRetriever.listMediaKeysInFolder(category.getName().replaceAll("\\s", "-"), BucketName.CATEGORIES.getName());

                    // 2) For each key, download bytes, encode to Base64, and derive a contentType
                    List<MediaDTO> mediaDTOs = keys.stream().map(key -> {
                        byte[] data = mediaRetriever.retrieveMedia(key, BucketName.CATEGORIES.getName());
                        String base64 = data != null ? Base64.getEncoder().encodeToString(data) : null;
                        String contentType = deriveContentTypeFromKey(key);
                        return new MediaDTO(base64, key, contentType);
                    }).toList();


                    // 3) Build the full DTO
                    return new ResponseCategoryDTO(category.getId(), category.getName(), category.getDescription(), category.getPriority(), category.isActive(), mediaDTOs, category.getTags().stream().map(catalogMapper::mapTagToResponseTagDTO).toList());
                })
                .sorted(Comparator.comparingInt(ResponseCategoryDTO::getPriority).thenComparingLong(ResponseCategoryDTO::getId))
                .collect(Collectors.toList());
    }

    @Override
    public List<ResponseCategoryDTO> getActiveCategories() {
        log.info("Fetching all categories with media");
        mediaUploader.createBucketIfNotExists(BucketName.CATEGORIES.getName());
        List<ResponseCategoryDTO> categoryList = categoryRepository.findByActiveTrue().stream().map(category -> {
            // 1) List all object keys in the folder named after the category
            List<String> keys = mediaRetriever.listMediaKeysInFolder(category.getName().replaceAll("\\s", "-"), BucketName.CATEGORIES.getName());

            // 2) For each key, download bytes, encode to Base64, and derive a contentType
            List<MediaDTO> mediaDTOs = keys.stream().map(key -> {
                byte[] data = mediaRetriever.retrieveMedia(key, BucketName.CATEGORIES.getName());
                String base64 = data != null ? Base64.getEncoder().encodeToString(data) : null;
                String contentType = deriveContentTypeFromKey(key);
                return new MediaDTO(base64, key, contentType);
            }).toList();

            // 3) Build the full DTO
            return new ResponseCategoryDTO(category.getId(), category.getName(), category.getDescription(), category.getPriority(), category.isActive(), mediaDTOs, null);
        }).toList();

        // sort by priority and by id then return
        return categoryList.stream()
                .sorted(Comparator.comparingInt(ResponseCategoryDTO::getPriority).thenComparingLong(ResponseCategoryDTO::getId))
                .collect(Collectors.toList());
    }

    @Override
    public List<ResponseProductDTO> createProduct(@Valid List<CreateProductDTO> createProductDTOList) {
        log.info("Creating products: {}", createProductDTOList);
        createProductDTOList.stream().filter(createProductDTO -> !productRepository.existsByName(createProductDTO.getName())).collect(Collectors.collectingAndThen(toList(), list -> {
            if (list.isEmpty()) {
                throw new IllegalArgumentException("All products already exist!");
            }
            return list;
        }));

        return createProductDTOList.stream().filter(createProductDTO -> !productRepository.existsByName(createProductDTO.getName())).map(createProductDTO -> {
                    // Process media uploads and collect image URLs
                    List<String> imageUrls = new ArrayList<>();
                    List<MediaDTO> responseMedia = new ArrayList<>();
                    if (createProductDTO.getMedia() != null) {
                        for (MediaDTO media : createProductDTO.getMedia()) {

                            // Upload media and get public URL
                            String publicUrl = mediaUploader.uploadBase64(media.base64Data(), createProductDTO.getName(), media.objectKey(), media.contentType(), BucketName.PRODUCTS.getName(), createProductDTO.getName());
                            if (publicUrl != null) {
                                imageUrls.add(publicUrl);
                            }

                            // Store original base64 data for response
                            responseMedia.add(new MediaDTO(media.base64Data(), createProductDTO.getName(), media.contentType()));
                        }
                    }

                    // Create and save category
                    Product product = new Product();
                    product.setName(createProductDTO.getName());
                    product.setPrice(createProductDTO.getPrice());
                    product.setDescription(createProductDTO.getDescription());
                    product.setWeightGrams(createProductDTO.getWeightGrams());
                    product.setCategory(categoryRepository.findById(createProductDTO.getCategoryId()).orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + createProductDTO.getCategoryId())));
                    product.setImageUrl(imageUrls);
                    List<Tag> tags = new ArrayList<>();
                    if (createProductDTO.getTagIds() != null) {
                        tags = createProductDTO.getTagIds().stream().map(tagRepository::findById).toList()
                                .stream().filter(Optional::isPresent).map(Optional::get).toList();
                    }
                    product.setTags(tags);
                    Product savedProduct = productRepository.save(product);

                    elasticsearchService.indexProduct(catalogMapper.mapProductToResponseProductDTO(savedProduct));

                    // Build response with original base64 data
                    return catalogMapper.mapProductToResponseProductDTO(savedProduct, responseMedia);
                }).sorted(Comparator.comparingInt(ResponseProductDTO::getPriority).thenComparingLong(ResponseProductDTO::getId))
                .collect(toList());
    }

    @Override
    public ResponseProductDTO updateProduct(Long id, UpdateProductDTO updateProductDTO) {
        log.info("Updating product with id {}: {}", id, updateProductDTO);

        // 1) Fetch existing product
        Product existing = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        // 2) Validate name uniqueness if changed
        if (!updateProductDTO.getName().equals(existing.getName()) && productRepository.existsByName(updateProductDTO.getName())) {
            throw new IllegalArgumentException("Product name already exists: " + updateProductDTO.getName());
        }

        // 3) Update basic fields
        existing.setName(updateProductDTO.getName());
        existing.setDescription(updateProductDTO.getDescription());
        existing.setPrice(updateProductDTO.getPrice());
        existing.setWeightGrams(updateProductDTO.getWeightGrams());

        // 5) Update tags in-place
        if (updateProductDTO.getTagIds() != null) {
            // load all Tag entities by id
            List<Tag> tags = tagRepository.findAllById(updateProductDTO.getTagIds());
            existing.getTags().clear();
            existing.getTags().addAll(tags);
        }

        // === Media handling ===

        // 6) Delete all the media form the original one
        if (existing.getImageUrl() != null) {
            for (String objectKey : existing.getImageUrl()) {
                mediaUploader.deleteMedia(objectKey);
            }
        }

        // 7) Upload new images
        List<String> newImageUrls = new ArrayList<>();
        List<MediaDTO> mediaResponses = new ArrayList<>();
        if (updateProductDTO.getMedia() != null) {
            for (MediaDTO m : updateProductDTO.getMedia()) {
                String publicUrl = mediaUploader.uploadBase64(
                        m.base64Data(),
                        updateProductDTO.getName(),
                        m.objectKey(),
                        m.contentType(),
                        BucketName.PRODUCTS.getName(),
                        updateProductDTO.getName()
                );
                if (publicUrl != null) {
                    newImageUrls.add(publicUrl);
                }
                mediaResponses.add(new MediaDTO(
                        m.base64Data(),
                        existing.getName(),
                        m.contentType()
                ));
            }
        }

        // 8) Replace the image list
        existing.getImageUrl().clear();
        existing.getImageUrl().addAll(newImageUrls);

        // 10) Persist
        Product savedProduct = productRepository.save(existing);

        elasticsearchService.indexProduct(catalogMapper.mapProductToResponseProductDTO(savedProduct));

        // 11) Map to response
        return catalogMapper.mapProductToResponseProductDTO(savedProduct, mediaResponses);
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

    public List<ResponseMixtureDTO> createMixture(@Valid List<CreateMixtureDTO> createMixtureDTOList) {
        log.info("Creating mixtures: {}", createMixtureDTOList.stream().map(CreateMixtureDTO::getName).toList());
        createMixtureDTOList.stream().filter(dto -> !mixtureRepository.existsByName(dto.getName())).collect(Collectors.collectingAndThen(toList(), list -> {
            if (list.isEmpty()) {
                throw new IllegalArgumentException("All mixtures already exist!");
            }
            return list;
        }));

        return createMixtureDTOList.stream().filter(dto -> !mixtureRepository.existsByName(dto.getName())).map(createMixtureDTO -> {
                    // Process media uploads and collect image URLs
                    List<String> imageUrls = new ArrayList<>();
                    List<MediaDTO> responseMedia = new ArrayList<>();
                    if (nonNull(createMixtureDTO.getMedia())) {
                        for (MediaDTO media : createMixtureDTO.getMedia()) {
                            String publicUrl = mediaUploader.uploadBase64(media.base64Data(), createMixtureDTO.getName(), media.objectKey(), media.contentType(), BucketName.MIXTURES.getName(), createMixtureDTO.getName());
                            if (publicUrl != null) {
                                imageUrls.add(publicUrl);
                            }
                            responseMedia.add(new MediaDTO(media.base64Data(), createMixtureDTO.getName(), media.contentType()));
                        }
                    }

                    // Create and save mixture
                    Mixture mixture = new Mixture();
                    mixture.setName(createMixtureDTO.getName());
                    mixture.setDescription(createMixtureDTO.getDescription());
                    mixture.setPriority(createMixtureDTO.getPriority());
                    mixture.setActive(createMixtureDTO.isActive());
                    mixture.setPrice(createMixtureDTO.getPrice());
                    mixture.setWeightGrams(createMixtureDTO.getWeightGrams());
                    mixture.setImageUrl(imageUrls);

                    // Fetch and set relationships
                    mixture.setProducts(createMixtureDTO.getProductIds().stream().map(productRepository::findById).filter(Optional::isPresent).map(Optional::get).toList());
                    mixture.setTags(createMixtureDTO.getTagIds().stream().map(tagRepository::findById).filter(Optional::isPresent).map(Optional::get).toList());
                    mixture.setCategories(List.of(categoryRepository.findById(createMixtureDTO.getCategoryId()).orElseThrow(() -> new EntityNotFoundException("Category not found with id: " + createMixtureDTO.getCategoryId()))));


                    Mixture savedMixture = mixtureRepository.save(mixture);
                    elasticsearchService.indexMixture(catalogMapper.mapMixtureToResponseMixtureDTO(savedMixture));

                    return new ResponseMixtureDTO(
                            savedMixture.getId(),
                            savedMixture.getName(),
                            savedMixture.getDescription(),
                            savedMixture.getPriority(),
                            savedMixture.isActive(),
                            responseMedia,
                            savedMixture.getCategories().get(0).getId(),
                            savedMixture.getProducts().stream().map(catalogMapper::mapProductToResponseProductDTO).toList(),
                            savedMixture.getTags().stream().map(Tag::getId).toList(),
                            savedMixture.getPrice(),
                            savedMixture.getWeightGrams()
                    );
                }).sorted(Comparator.comparingInt(ResponseMixtureDTO::getPriority).thenComparingLong(ResponseMixtureDTO::getId))
                .collect(toList());
    }


    @Override
    public ResponseMixtureDTO updateMixture(Long id, UpdateMixtureDTO updateMixtureDTO) {
        log.info("Updating mixture with id {}: {}", id, updateMixtureDTO);

        Mixture existingMixture = mixtureRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("Mixture not found with id: " + id));

        // Validate name uniqueness if changed
        if (!updateMixtureDTO.getName().equals(existingMixture.getName()) && mixtureRepository.existsByName(updateMixtureDTO.getName())) {
            throw new IllegalArgumentException("Mixture name already exists: " + updateMixtureDTO.getName());
        }

        // Update basic fields
        existingMixture.setName(updateMixtureDTO.getName());
        existingMixture.setDescription(updateMixtureDTO.getDescription());
        existingMixture.setPriority(updateMixtureDTO.getPriority());
        existingMixture.setActive(updateMixtureDTO.isActive());
        existingMixture.setPrice(updateMixtureDTO.getPrice());
        existingMixture.setWeightGrams(updateMixtureDTO.getWeightGrams());

        // Update relationships
        existingMixture.setProducts(updateMixtureDTO.getProductIds().stream().map(productRepository::findById).filter(Optional::isPresent).map(Optional::get).toList());
        existingMixture.setTags(updateMixtureDTO.getTagIds().stream().map(tagRepository::findById).filter(Optional::isPresent).map(Optional::get).toList());
        existingMixture.setCategories(List.of(categoryRepository.findById(updateMixtureDTO.getCategoryId()).orElseThrow(() -> new EntityNotFoundException("Category not found with id: " + updateMixtureDTO.getCategoryId()))));

        // Media handling
        // 1) Delete old media
        if (nonNull(existingMixture.getImageUrl())) {
            existingMixture.getImageUrl().forEach(mediaUploader::deleteMedia);
        }

        // 2) Upload new media and update images list
        List<String> newImageUrls = new ArrayList<>();
        List<MediaDTO> responseMedia = new ArrayList<>();
        if (nonNull(updateMixtureDTO.getMedia())) {
            for (MediaDTO media : updateMixtureDTO.getMedia()) {
                String publicUrl = mediaUploader.uploadBase64(media.base64Data(), updateMixtureDTO.getName(), media.objectKey(), media.contentType(), BucketName.MIXTURES.getName(), updateMixtureDTO.getName());
                if (nonNull(publicUrl)) {
                    newImageUrls.add(publicUrl);
                }
                responseMedia.add(new MediaDTO(media.base64Data(), updateMixtureDTO.getName(), media.contentType()));
            }
        }
        existingMixture.setImageUrl(newImageUrls);

        Mixture savedMixture = mixtureRepository.save(existingMixture);
        elasticsearchService.indexMixture(catalogMapper.mapMixtureToResponseMixtureDTO(savedMixture));

        return new ResponseMixtureDTO(
                savedMixture.getId(),
                savedMixture.getName(),
                savedMixture.getDescription(),
                savedMixture.getPriority(),
                savedMixture.isActive(),
                responseMedia,
                savedMixture.getCategories().get(0).getId(),
                savedMixture.getProducts().stream().map(catalogMapper::mapProductToResponseProductDTO).toList(),
                savedMixture.getTags().stream().map(Tag::getId).toList(),
                savedMixture.getPrice(),
                savedMixture.getWeightGrams()
        );
    }

    @Override
    public List<ResponseCategoryDTO> createCategory(@Valid List<CreateCategoryDTO> createCategoryDTOList) {
        log.info("Creating categories: {}", createCategoryDTOList);
        createCategoryDTOList.stream().filter(dto -> !categoryRepository.existsByName(dto.getName())).collect(Collectors.collectingAndThen(toList(), list -> {
            if (list.isEmpty()) {
                throw new IllegalArgumentException("All categories already exist!");
            }
            return list;
        }));
        return createCategoryDTOList.stream().filter(dto -> !categoryRepository.existsByName(dto.getName())).map(createCategoryDTO -> {
                    // Process media uploads and collect image URLs
                    List<String> imageUrls = new ArrayList<>();
                    List<MediaDTO> responseMedia = new ArrayList<>();
                    if (createCategoryDTO.getMedia() != null) {
                        for (MediaDTO media : createCategoryDTO.getMedia()) {

                            // Upload media and get public URL
                            String publicUrl = mediaUploader.uploadBase64(media.base64Data(), createCategoryDTO.getName(), media.objectKey(), media.contentType(), BucketName.CATEGORIES.getName(), createCategoryDTO.getName());
                            if (publicUrl != null) {
                                imageUrls.add(publicUrl);
                            }
                            // Store original base64 data for response
                            responseMedia.add(new MediaDTO(media.base64Data(), createCategoryDTO.getName(), media.contentType()));
                        }
                    }

                    // Create and save category
                    Category category = new Category();
                    category.setName(createCategoryDTO.getName());
                    category.setDescription(createCategoryDTO.getDescription());
                    category.setPriority(createCategoryDTO.getPriority());
                    category.setActive(createCategoryDTO.isActive());
                    category.setTags(createCategoryDTO.getTagIds().stream().map(tagRepository::findById).filter(Optional::isPresent).map(Optional::get).toList());
                    category.setImageUrl(imageUrls);

                    Category savedCategory = categoryRepository.save(category);

                    elasticsearchService.indexCategory(catalogMapper.mapCategoryToResponseCategoryDTO(savedCategory));

                    // Build response with original base64 data
                    return new ResponseCategoryDTO(savedCategory.getId(), savedCategory.getName(), savedCategory.getDescription(), savedCategory.getPriority(), category.isActive(), responseMedia, category.getTags().stream().map(catalogMapper::mapTagToResponseTagDTO).toList());
                }).sorted(Comparator.comparingInt(ResponseCategoryDTO::getPriority).thenComparingLong(ResponseCategoryDTO::getId))
                .collect(toList());
    }

    @Override
    public ResponseCategoryDTO updateCategory(Long id, UpdateCategoryDTO updateCategoryDTO) {
        log.info("Updating category with id {}: {}", id, updateCategoryDTO);
        Category existingCategory = categoryRepository.findById(id).orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
        categoryRepository.findByName(updateCategoryDTO.getName()).ifPresent(existingCategoryByName -> {
            if (!existingCategoryByName.getId().equals(id)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Category name already exists: " + updateCategoryDTO.getName());
            }
        });

        // Remove old media
        for (String imageUrl : existingCategory.getImageUrl()) {
            mediaUploader.deleteMedia(imageUrl);
        }

        // Process media uploads and collect results
        List<String> newImageUrls = new ArrayList<>();
        List<MediaDTO> responseMedia = new ArrayList<>();
        if (updateCategoryDTO.getMedia() != null) {
            for (MediaDTO media : updateCategoryDTO.getMedia()) {

                // Upload media and get public URL
                String publicUrl = mediaUploader.uploadBase64(media.base64Data(), updateCategoryDTO.getName(), media.objectKey(), media.contentType(), BucketName.CATEGORIES.getName(), updateCategoryDTO.getName());

                if (publicUrl != null) {
                    newImageUrls.add(publicUrl);
                }

                // Store original base64 data for response
                responseMedia.add(new MediaDTO(media.base64Data(), updateCategoryDTO.getName(), media.contentType()));
            }
        }

        // Update existing category
        existingCategory.setName(updateCategoryDTO.getName());
        existingCategory.setDescription(updateCategoryDTO.getDescription());
        existingCategory.setPriority(updateCategoryDTO.getPriority());
        existingCategory.setActive(updateCategoryDTO.isActive());
        existingCategory.getImageUrl().addAll(newImageUrls);
        existingCategory.setTags(
                new ArrayList<>(
                        updateCategoryDTO.getTagIds()
                                .stream()
                                .map(tagRepository::findById)
                                .filter(Optional::isPresent)
                                .map(Optional::get)
                                .toList()
                )
        );
        Category savedCategory = categoryRepository.save(existingCategory);

        elasticsearchService.indexCategory(catalogMapper.mapCategoryToResponseCategoryDTO(savedCategory));

        // Build response with updated data and new media
        return new ResponseCategoryDTO(savedCategory.getId(), savedCategory.getName(), savedCategory.getDescription(), savedCategory.getPriority(), savedCategory.isActive(), responseMedia, savedCategory.getTags().stream().map(catalogMapper::mapTagToResponseTagDTO).toList());
    }

    @Override
    public ResponseProductDTO getProductById(Long id) {
        log.info("Fetching product with id {} including media", id);
        Product product = productRepository.findById(id).orElseThrow(() -> new RuntimeException("Product not found with id: " + id));

        // 1) List all object keys in the folder named after the product
        List<String> keys = mediaRetriever.listMediaKeysInFolder(product.getName().replaceAll("\\s", "-"), BucketName.PRODUCTS.getName());

        // 2) For each key, download bytes, encode to Base64, and derive a contentType
        List<MediaDTO> mediaDTOs = keys.stream().map(key -> {
            byte[] data = mediaRetriever.retrieveMedia(key, BucketName.PRODUCTS.getName());
            String base64 = data != null ? Base64.getEncoder().encodeToString(data) : null;
            String contentType = deriveContentTypeFromKey(key);
            return new MediaDTO(base64, key, contentType);
        }).toList();

        return new ResponseProductDTO(product.getId(), product.getName(), product.getDescription(), product.getPriority(), product.isActive(), mediaDTOs, product.getTags().stream().map(catalogMapper::mapTagToResponseTagDTO).toList(), product.getCategory().getId(), product.getPrice(), product.getWeightGrams());
    }

    @Override
    public List<ResponseTagDTO> createTags(@Valid List<CreateTagDTO> createTagDTOList) {
        log.info("Creating tags: {}", createTagDTOList.stream().map(CreateTagDTO::getName).toList());
        createTagDTOList.stream().filter(dto -> !tagRepository.existsByName(dto.getName())).collect(Collectors.collectingAndThen(toList(), list -> {
            if (list.isEmpty()) {
                throw new IllegalArgumentException("All tags already exist!");
            }
            return list;
        }));
        return createTagDTOList.stream().filter(dto -> !tagRepository.existsByName(dto.getName())).map(createTagDTO -> {
                    // Process media uploads and collect image URLs
                    List<String> imageUrls = new ArrayList<>();
                    List<MediaDTO> responseMedia = new ArrayList<>();
                    if (createTagDTO.getMedia() != null) {
                        for (MediaDTO media : createTagDTO.getMedia()) {
                            String publicUrl = mediaUploader.uploadBase64(media.base64Data(), createTagDTO.getName(), media.objectKey(), media.contentType(), BucketName.TAGS.getName(), createTagDTO.getName());
                            if (publicUrl != null) {
                                imageUrls.add(publicUrl);
                            }
                            responseMedia.add(new MediaDTO(media.base64Data(), createTagDTO.getName(), media.contentType()));
                        }
                    }

                    // Create and save category
                    Tag tag = new Tag();
                    tag.setName(createTagDTO.getName());
                    tag.setDescription(createTagDTO.getDescription());
                    tag.setPriority(createTagDTO.getPriority());
                    tag.setActive(createTagDTO.isActive());
                    tag.setImageUrl(imageUrls);

                    Tag savedTag = tagRepository.save(tag);
                    elasticsearchService.indexTag(catalogMapper.mapTagToResponseTagDTO(savedTag));

                    // Build response with original base64 data
                    return new ResponseTagDTO(savedTag.getId(), savedTag.getName(), savedTag.getDescription(), savedTag.getPriority(), savedTag.isActive(), responseMedia, new ArrayList<>(), new ArrayList<>(), new ArrayList<>());
                }).sorted(Comparator.comparingInt(ResponseTagDTO::getPriority).thenComparingLong(ResponseTagDTO::getId))
                .collect(toList());
    }

    @Override
    public List<ResponseTagDTO> getAllTags() {
        log.info("Fetching all tags with media");
        mediaUploader.createBucketIfNotExists(BucketName.TAGS.getName());
        return tagRepository.findAll().stream().map(tag -> {
                    // 1) List all object keys in the folder named after the tag
                    List<String> keys = mediaRetriever.listMediaKeysInFolder(tag.getName().replaceAll("\\s", "-"), BucketName.TAGS.getName());

                    // 2) For each key, download bytes, encode to Base64, and derive a contentType
                    List<MediaDTO> mediaDTOs = keys.stream().map(key -> {
                        byte[] data = mediaRetriever.retrieveMedia(key, BucketName.TAGS.getName());
                        String base64 = data != null ? Base64.getEncoder().encodeToString(data) : null;
                        String contentType = deriveContentTypeFromKey(key);
                        return new MediaDTO(base64, key, contentType);
                    }).toList();

                    // 3) Build the full DTO
                    return new ResponseTagDTO(tag.getId(), tag.getName(), tag.getDescription(), tag.getPriority(), tag.isActive(), mediaDTOs, tag.getCategories().stream().map(catalogMapper::mapCategoryToResponseCategoryDTO).toList(), tag.getProducts().stream().map(catalogMapper::mapProductToResponseProductDTO).toList(), tag.getMixtures().stream().map(catalogMapper::mapMixtureToResponseMixtureDTO).toList());
                }).sorted(Comparator.comparingInt(ResponseTagDTO::getPriority).thenComparingLong(ResponseTagDTO::getId))
                .collect(Collectors.toList());
    }

    @Override
    public ResponseTagDTO updateTag(Long id, UpdateTagDTO updateTagDTO) {
        log.info("Updating tag with id {}: {}", id, updateTagDTO);
        Tag existingTag = tagRepository.findById(id).orElseThrow(() -> new RuntimeException("Tag not found with id: " + id));
        tagRepository.findByName(updateTagDTO.getName()).ifPresent(existingTagByName -> {
            if (!existingTagByName.getId().equals(id)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Tag name already exists: " + updateTagDTO.getName());
            }
        });

        // Remove old media
        for (String imageUrl : existingTag.getImageUrl()) {
            mediaUploader.deleteMedia(imageUrl);
        }

        // Process media uploads and collect results
        List<String> newImageUrls = new ArrayList<>();
        List<MediaDTO> responseMedia = new ArrayList<>();
        if (updateTagDTO.getMedia() != null) {
            for (MediaDTO media : updateTagDTO.getMedia()) {

                // Upload media and get public URL
                String publicUrl = mediaUploader.uploadBase64(media.base64Data(), updateTagDTO.getName(), media.objectKey(), media.contentType(), BucketName.TAGS.getName(), updateTagDTO.getName());

                if (publicUrl != null) {
                    newImageUrls.add(publicUrl);
                }

                // Store original base64 data for response
                responseMedia.add(new MediaDTO(media.base64Data(), updateTagDTO.getName(), media.contentType()));
            }
        }

        // Update existing category
        existingTag.setName(updateTagDTO.getName());
        existingTag.setDescription(updateTagDTO.getDescription());
        existingTag.setPriority(updateTagDTO.getPriority());
        existingTag.setActive(updateTagDTO.isActive());
        existingTag.getImageUrl().addAll(newImageUrls);
        existingTag.setCategories(
                new ArrayList<>(
                        updateTagDTO.getCategoryIds()
                                .stream()
                                .map(categoryRepository::findById)
                                .filter(Optional::isPresent)
                                .map(Optional::get)
                                .toList()
                )
        );
        existingTag.setProducts(
                new ArrayList<>(
                        updateTagDTO.getProductIds()
                                .stream()
                                .map(productRepository::findById)
                                .filter(Optional::isPresent)
                                .map(Optional::get)
                                .toList()
                )
        );
        existingTag.setMixtures(
                new ArrayList<>(
                        updateTagDTO.getMixtureIds()
                                .stream()
                                .map(mixtureRepository::findById)
                                .filter(Optional::isPresent)
                                .map(Optional::get)
                                .toList()
                )
        );

        Tag savedTag = tagRepository.save(existingTag);

        elasticsearchService.indexTag(catalogMapper.mapTagToResponseTagDTO(savedTag));

        // Build response with updated data and new media
        return new ResponseTagDTO(savedTag.getId(), savedTag.getName(), savedTag.getDescription(), savedTag.getPriority(), savedTag.isActive(), responseMedia, savedTag.getCategories().stream().map(catalogMapper::mapCategoryToResponseCategoryDTO).toList(), savedTag.getProducts().stream().map(catalogMapper::mapProductToResponseProductDTO).toList(), savedTag.getMixtures().stream().map(catalogMapper::mapMixtureToResponseMixtureDTO).toList());
    }

    @Override
    public void deleteProductById(Long id) {
        log.info("Deleting product with id: {}", id);
        Optional<Product> product = productRepository.findById(id);
        if (product.isPresent()) {
            for (String imageUrl : product.get().getImageUrl()) {
                mediaUploader.deleteMedia(imageUrl);
            }
            elasticsearchService.deleteProduct(catalogMapper.mapProductToResponseProductDTO(product.get()));
        }
        productRepository.deleteById(id);
    }

    @Override
    public void deleteMixtureById(Long id) {
        log.info("Deleting mixture with id: {}", id);
        Optional<Mixture> mixture = mixtureRepository.findById(id);
        if (mixture.isPresent()) {
            for (String imageUrl : mixture.get().getImageUrl()) {
                mediaUploader.deleteMedia(imageUrl);
            }
            elasticsearchService.deleteMixture(catalogMapper.mapMixtureToResponseMixtureDTO(mixture.get()));
        }
        mixtureRepository.deleteById(id);
    }

    @Override
    public void deleteCategoryById(Long id) {
        log.info("Deleting category with id: {}", id);
        Optional<Category> category = categoryRepository.findById(id);
        if (category.isPresent()) {
            for (String imageUrl : category.get().getImageUrl()) {
                mediaUploader.deleteMedia(imageUrl);
            }
            elasticsearchService.deleteCategory(catalogMapper.mapCategoryToResponseCategoryDTO(category.get()));
        }
        categoryRepository.deleteById(id);
    }

    @Override
    public void deleteTagById(Long id) {
        log.info("Deleting tag with id: {}", id);
        Optional<Tag> tag = tagRepository.findById(id);
        if (tag.isPresent()) {
            for (String imageUrl : tag.get().getImageUrl()) {
                mediaUploader.deleteMedia(imageUrl);
            }
            elasticsearchService.deleteTag(catalogMapper.mapTagToResponseTagDTO(tag.get()));
        }
        tagRepository.deleteById(id);
    }

    @Override
    public ResponseMixtureDTO getMixtureById(Long id) {
        log.info("Fetching mixture with id {} including media", id);
        Mixture mixture = mixtureRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Mixture not found with id: " + id));

        List<String> keys = mediaRetriever.listMediaKeysInFolder(mixture.getName().replaceAll("\\s", "-"), BucketName.MIXTURES.getName());
        List<MediaDTO> mediaDTOs = keys.stream().map(key -> {
            byte[] data = mediaRetriever.retrieveMedia(key, BucketName.MIXTURES.getName());
            String base64 = data != null ? Base64.getEncoder().encodeToString(data) : null;
            String contentType = deriveContentTypeFromKey(key);
            return new MediaDTO(base64, key, contentType);
        }).toList();

        return new ResponseMixtureDTO(
                mixture.getId(),
                mixture.getName(),
                mixture.getDescription(),
                mixture.getPriority(),
                mixture.isActive(),
                mediaDTOs,
                mixture.getCategories().get(0).getId(), // Assuming one category per mixture
                mixture.getProducts().stream().map(catalogMapper::mapProductToResponseProductDTO).toList(),
                mixture.getTags().stream().map(Tag::getId).toList(),
                mixture.getPrice(),
                mixture.getWeightGrams()
        );
    }

    @Override
    public ResponseCategoryDTO getCategoryById(Long id) {
        log.info("Fetching category with id {} including media", id);
        Category category = categoryRepository.findById(id).orElseThrow(() -> new RuntimeException("Category not found with id: " + id));

        List<String> keys = mediaRetriever.listMediaKeysInFolder(category.getName().replaceAll("\\s", "-"), BucketName.CATEGORIES.getName());
        List<MediaDTO> mediaDTOs = keys.stream().map(key -> {
            byte[] data = mediaRetriever.retrieveMedia(key, BucketName.CATEGORIES.getName());
            String base64 = data != null ? Base64.getEncoder().encodeToString(data) : null;
            String contentType = deriveContentTypeFromKey(key);
            return new MediaDTO(base64, key, contentType);
        }).toList();

        return new ResponseCategoryDTO(category.getId(), category.getName(), category.getDescription(), category.getPriority(), category.isActive(), mediaDTOs, category.getTags().stream().map(catalogMapper::mapTagToResponseTagDTO).toList());
    }

    @Override
    public ResponseTagDTO getTagById(Long id) {
        log.info("Fetching tag with id {} including media", id);
        Tag tag = tagRepository.findById(id).orElseThrow(() -> new RuntimeException("Tag not found with id: " + id));

        List<String> keys = mediaRetriever.listMediaKeysInFolder(tag.getName().replaceAll("\\s", "-"), BucketName.TAGS.getName());
        List<MediaDTO> mediaDTOs = keys.stream().map(key -> {
            byte[] data = mediaRetriever.retrieveMedia(key, BucketName.TAGS.getName());
            String base64 = data != null ? Base64.getEncoder().encodeToString(data) : null;
            String contentType = deriveContentTypeFromKey(key);
            return new MediaDTO(base64, key, contentType);
        }).toList();

        return new ResponseTagDTO(tag.getId(), tag.getName(), tag.getDescription(), tag.getPriority(), tag.isActive(), mediaDTOs, tag.getCategories().stream().map(catalogMapper::mapCategoryToResponseCategoryDTO).toList(), tag.getProducts().stream().map(catalogMapper::mapProductToResponseProductDTO).toList(), tag.getMixtures().stream().map(catalogMapper::mapMixtureToResponseMixtureDTO).toList());
    }

    private String deriveContentTypeFromKey(String key) {
        if (key.endsWith(".jpg") || key.endsWith(".jpeg")) {
            return "image/jpeg";
        } else if (key.endsWith(".png")) {
            return "image/png";
        } else if (key.endsWith(".gif")) {
            return "image/gif";
        } else if (key.endsWith(".svg")) {
            return "image/svg+xml";
        } else {
            return "application/octet-stream"; // Default
        }
    }
}
