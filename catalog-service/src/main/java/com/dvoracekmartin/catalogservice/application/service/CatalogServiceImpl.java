package com.dvoracekmartin.catalogservice.application.service;

import com.dvoracekmartin.catalogservice.application.dto.utils.CatalogMapper;
import com.dvoracekmartin.catalogservice.application.dto.category.CreateCategoryDTO;
import com.dvoracekmartin.catalogservice.application.dto.category.ResponseCatalogItemDTO;
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
import java.util.function.Function;
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
        return productRepository.findAll().stream().map(product -> {
            // 1) List all object keys in the folder named after the product ID
            List<String> keys = mediaRetriever.listMediaKeysInFolder(product.getName().replaceAll("\\s", "-"), BucketName.PRODUCTS.getName());

            List<MediaDTO> mediaDTOs = keys.stream().map(key -> {
                byte[] data = mediaRetriever.retrieveMedia(key, BucketName.PRODUCTS.getName());
                String base64 = data != null ? Base64.getEncoder().encodeToString(data) : null;
                String contentType = deriveContentTypeFromKey(key);
                return new MediaDTO(base64, key, contentType);
            }).toList();

            return new ResponseProductDTO(product.getId(), product.getName(), product.getDescription(), product.getPriority(), product.isActive(), mediaDTOs, product.getTags().stream().map(catalogMapper::mapTagToResponseTagDTO).toList(), product.getCategory().getId(), product.getPrice(), product.getWeightGrams());
        }).toList();
    }

    @Override
    public List<ResponseProductDTO> getAllProductsByCategoryId(Long categoryId) {
        mediaUploader.createBucketIfNotExists(BucketName.PRODUCTS.getName());
        log.info("Fetching all products with media by CategoryId");
        return productRepository.findAllByCategoryId(categoryId).stream().map(product -> {
            // 1) List all object keys in the folder named after the product ID
            List<String> keys = mediaRetriever.listMediaKeysInFolder(product.getName().replaceAll("\\s", "-"), BucketName.PRODUCTS.getName());

            List<MediaDTO> mediaDTOs = keys.stream().map(key -> {
                byte[] data = mediaRetriever.retrieveMedia(key, BucketName.PRODUCTS.getName());
                String base64 = data != null ? Base64.getEncoder().encodeToString(data) : null;
                String contentType = deriveContentTypeFromKey(key);
                return new MediaDTO(base64, key, contentType);
            }).toList();

            return new ResponseProductDTO(product.getId(), product.getName(), product.getDescription(), product.getPriority(), product.isActive(), mediaDTOs, product.getTags().stream().map(catalogMapper::mapTagToResponseTagDTO).toList(), product.getCategory().getId(), product.getPrice(), product.getWeightGrams());
        }).toList();
    }

    @Override
    public List<ResponseMixtureDTO> getAllMixtures() {
        log.info("Fetching all mixtures");
        mediaUploader.createBucketIfNotExists(BucketName.MIXTURES.getName());
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
            product.setCategory(categoryRepository.findById(createProductDTO.getCategoryId()).orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + createProductDTO.getCategoryId())));
            product.setImages(imageUrls);
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
        }).collect(toList());
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
        if (existing.getImages() != null) {
            for (String objectKey : existing.getImages()) {
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
        existing.getImages().clear();
        existing.getImages().addAll(newImageUrls);

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
            category.setImages(imageUrls);

            Category savedCategory = categoryRepository.save(category);

            elasticsearchService.indexCategory(catalogMapper.mapCategoryToResponseCategoryDTO(savedCategory));

            // Build response with original base64 data
            return new ResponseCategoryDTO(savedCategory.getId(), savedCategory.getName(), savedCategory.getDescription(), savedCategory.getPriority(), category.isActive(), responseMedia, category.getTags().stream().map(catalogMapper::mapTagToResponseTagDTO).toList());
        }).collect(toList());
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
        for (String imageUrl : existingCategory.getImages()) {
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
        existingCategory.getImages().addAll(newImageUrls);
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

        // 3) Build the full DTO
        return new ResponseProductDTO(product.getId(), product.getName(), product.getDescription(), product.getPriority(), product.isActive(), mediaDTOs, product.getTags().stream().map(catalogMapper::mapTagToResponseTagDTO).toList(), product.getCategory().getId(), product.getPrice(), product.getWeightGrams());
    }

    @Override
    public ResponseMixtureDTO getMixtureById(Long id) {
        return getEntityById(id, mixtureRepository::findById, catalogMapper::mapMixtureToResponseMixtureDTO);
    }

    @Override
    public ResponseCategoryDTO getCategoryById(Long id) {
        log.info("Fetching category with id {} including media", id);
        Category category = categoryRepository.findById(id).orElseThrow(() -> new RuntimeException("Category not found with id: " + id));

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
    }

    @Override
    public void deleteProductById(Long id) {
        log.info("Deleting product with id: {}", id);
        Optional<Product> product = productRepository.findById(id);
        if (product.isPresent()) {
            // Delete associated media files
            for (String imageUrl : product.get().getImages()) {
                mediaUploader.deleteMedia(imageUrl);
            }
            elasticsearchService.deleteProduct(catalogMapper.mapProductToResponseProductDTO(product.get()));
        }
        productRepository.deleteById(id);
    }

    @Override
    public void deleteMixtureById(Long id) {
        log.info("Deleting mixture with id: {}", id);
        if (!mixtureRepository.existsById(id)) {
            throw new EntityNotFoundException("Mixutre not found with id: " + id);
        }
        elasticsearchService.deleteMixture(catalogMapper.mapMixtureToResponseMixtureDTO(mixtureRepository.getReferenceById(id)));
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
            elasticsearchService.deleteCategory(catalogMapper.mapCategoryToResponseCategoryDTO(category.get()));
        }
        categoryRepository.deleteById(id);
    }

    @Override
    public List<ResponseTagDTO> getAllTags() {

        return tagRepository.findAll().stream().map(tag -> {
            // 1) List all object keys in the folder named after the tag ID
            List<String> keys = mediaRetriever.listMediaKeysInFolder(tag.getName().replaceAll("\\s", "-"), BucketName.TAGS.getName());

            List<MediaDTO> mediaDTOs = keys.stream().map(key -> {
                byte[] data = mediaRetriever.retrieveMedia(key, BucketName.TAGS.getName());
                String base64 = data != null ? Base64.getEncoder().encodeToString(data) : null;
                String contentType = deriveContentTypeFromKey(key);
                return new MediaDTO(base64, key, contentType);
            }).toList();

            return new ResponseTagDTO(tag.getId(), tag.getName(), tag.getDescription(), tag.getPriority(), tag.isActive(), mediaDTOs,
                    tag.getCategories().stream()
                            .map(catalogMapper::mapCategoryToResponseCategoryDTO)
                            .toList(), tag.getProducts().stream()
                    .map(catalogMapper::mapProductToResponseProductDTO)
                    .toList(),
                    tag.getMixtures().stream()
                            .map(catalogMapper::mapMixtureToResponseMixtureDTO)
                            .toList());
        }).toList();
    }

    @Override
    public ResponseTagDTO getTagById(Long id) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Tag not found with id: " + id));
        List<String> keys = mediaRetriever.listMediaKeysInFolder(tag.getName().replaceAll("\\s", "-"), BucketName.TAGS.getName());

        List<MediaDTO> mediaDTOs = keys.stream().map(key -> {
            byte[] data = mediaRetriever.retrieveMedia(key, BucketName.TAGS.getName());
            String base64 = data != null ? Base64.getEncoder().encodeToString(data) : null;
            String contentType = deriveContentTypeFromKey(key);
            return new MediaDTO(base64, key, contentType);
        }).toList();

        return new ResponseTagDTO(tag.getId(), tag.getName(), tag.getDescription(), tag.getPriority(), tag.isActive(), mediaDTOs,
                tag.getCategories().stream()
                        .map(catalogMapper::mapCategoryToResponseCategoryDTO)
                        .toList(), tag.getProducts().stream()
                .map(catalogMapper::mapProductToResponseProductDTO)
                .toList(),
                tag.getMixtures().stream()
                        .map(catalogMapper::mapMixtureToResponseMixtureDTO)
                        .toList());
    }


    @Override
    @Transactional
    public List<ResponseTagDTO> createTags(List<CreateTagDTO> createTagDTOs) {
        log.info("Creating tags: {}", createTagDTOs.stream().map(CreateTagDTO::getName).toList());
        return createTagDTOs.stream().filter(dto -> !tagRepository.existsByName(dto.getName())).collect(Collectors.collectingAndThen(toList(), list -> {
            if (list.isEmpty()) {
                throw new IllegalArgumentException("All tags already exist!");
            }
            return list;
        })).stream().map(createTagDTO -> {
            // Process media uploads and collect image URLs
            List<String> imageUrls = new ArrayList<>();
            List<MediaDTO> responseMedia = new ArrayList<>();

            if (nonNull(createTagDTO.getMedia())) {
                for (MediaDTO media : createTagDTO.getMedia()) {
                    // Upload media and get public URL
                    String publicUrl = mediaUploader.uploadBase64(media.base64Data(), createTagDTO.getName(), media.objectKey(), media.contentType(), BucketName.TAGS.getName(), createTagDTO.getName());
                    if (publicUrl != null) {
                        imageUrls.add(publicUrl);
                    }
                    // Store original base64 data for response
                    responseMedia.add(new MediaDTO(media.base64Data(), media.objectKey(), media.contentType()));
                }
            }

            // Create and save tag
            Tag tag = new Tag();
            tag.setName(createTagDTO.getName());
            tag.setDescription(createTagDTO.getDescription());
            tag.setPriority(createTagDTO.getPriority());
            tag.setActive(createTagDTO.isActive());
            tag.setImages(imageUrls);

            Tag savedTag = tagRepository.save(tag);

            elasticsearchService.indexTag(catalogMapper.mapTagToResponseTagDTO(savedTag));

            // Build response with original base64 data
            return new ResponseTagDTO(savedTag.getId(), savedTag.getName(), savedTag.getDescription(), savedTag.getPriority(), savedTag.isActive(), responseMedia, Collections.emptyList(), Collections.emptyList(), Collections.emptyList());
        }).toList();
    }

    @Override
    @Transactional
    public ResponseTagDTO updateTag(Long id, UpdateTagDTO dto) {
        // 1) Fetch the existing tag or fail
        Tag existingTag = tagRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Tag not found with id: " + id));

        // 2) Update scalar fields
        existingTag.setName(dto.getName());

        // 3) Load related entities from DB
        List<Category> newCategories = categoryRepository.findAllById(dto.getCategoryIds());
        List<Product> newProducts = productRepository.findAllById(dto.getProductIds());
        List<Mixture> newMixtures = mixtureRepository.findAllById(dto.getMixtureIds());

        // 4) Clear old references from owning side (optional, to prevent duplicates)
        for (Product p : existingTag.getProducts()) {
            p.getTags().remove(existingTag);
        }
        for (Category c : existingTag.getCategories()) {
            c.getTags().remove(existingTag);
        }
        for (Mixture m : existingTag.getMixtures()) {
            m.getTags().remove(existingTag);
        }

        // 5) Update owning side (Product, Category, Mixture)
        for (Product p : newProducts) {
            if (!p.getTags().contains(existingTag)) {
                p.getTags().add(existingTag);
            }
        }
        for (Category c : newCategories) {
            if (!c.getTags().contains(existingTag)) {
                c.getTags().add(existingTag);
            }
        }
        for (Mixture m : newMixtures) {
            if (!m.getTags().contains(existingTag)) {
                m.getTags().add(existingTag);
            }
        }

        // 6) Update tag-side collections for DTO consistency (Hibernate will not persist from here)
        existingTag.setProducts(newProducts);
        existingTag.setCategories(newCategories);
        existingTag.setMixtures(newMixtures);

        // 7) Save tag (save is optional — might be saved by cascade from owning side if configured)
        tagRepository.save(existingTag);

        elasticsearchService.indexTag(catalogMapper.mapTagToResponseTagDTO(existingTag));

        return catalogMapper.mapTagToResponseTagDTO(existingTag);
    }

    public void indexAll() {
        elasticsearchService.indexAll(getAllCategories(), getAllProducts(), getAllMixtures(), getAllTags());
    }

    @Override
    @Transactional
    public void deleteTagById(Long id) {
        Tag existingTag = tagRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Tag not found with id: " + id));
        // 4) Clear old references from owning side (optional, to prevent duplicates)
        for (Product p : existingTag.getProducts()) {
            p.getTags().remove(existingTag);
        }
        for (Category c : existingTag.getCategories()) {
            c.getTags().remove(existingTag);
        }
        for (Mixture m : existingTag.getMixtures()) {
            m.getTags().remove(existingTag);
        }
        tagRepository.save(existingTag);
        elasticsearchService.deleteTag(catalogMapper.mapTagToResponseTagDTO(tagRepository.getReferenceById(id)));
        tagRepository.deleteById(id);
    }

    private <T, R> R getEntityById(Long id, Function<Long, Optional<T>> findById, Function<T, R> mapper) {
        log.info("Fetching {} with id: {}", "Mixture", id);
        return findById.apply(id).map(mapper).orElseThrow(() -> new RuntimeException("Mixture" + " not found with id: " + id));
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
