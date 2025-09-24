package com.dvoracekmartin.catalogservice.application.service;

import com.dvoracekmartin.catalogservice.application.dto.category.CreateCategoryDTO;
import com.dvoracekmartin.catalogservice.application.dto.category.UpdateCategoryDTO;
import com.dvoracekmartin.catalogservice.application.dto.mixture.CreateMixtureDTO;
import com.dvoracekmartin.catalogservice.application.dto.mixture.UpdateMixtureDTO;
import com.dvoracekmartin.catalogservice.application.dto.product.CreateProductDTO;
import com.dvoracekmartin.catalogservice.application.dto.product.UpdateProductDTO;
import com.dvoracekmartin.catalogservice.application.dto.product.UpdateProductStockDTO;
import com.dvoracekmartin.catalogservice.application.dto.tag.CreateTagDTO;
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
import com.dvoracekmartin.common.dto.category.ResponseCategoryDTO;
import com.dvoracekmartin.common.dto.media.MediaDTO;
import com.dvoracekmartin.common.dto.mixture.ResponseMixtureDTO;
import com.dvoracekmartin.common.dto.product.ResponseProductDTO;
import com.dvoracekmartin.common.dto.tag.ResponseTagDTO;
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

    // Helper methods
    private List<MediaDTO> retrieveMediaForEntity(String entityId, BucketName bucketName) {
        List<String> keys = mediaRetriever.listMediaKeysInFolder(entityId, bucketName.getName());
        return keys.stream().map(key -> {
            byte[] data = mediaRetriever.retrieveMedia(key, bucketName.getName());
            String base64 = data != null ? Base64.getEncoder().encodeToString(data) : null;
            return new MediaDTO(base64, key, deriveContentTypeFromKey(key));
        }).toList();
    }

    private MediaUploadResult uploadMedia(List<MediaDTO> mediaList, String entityId, BucketName bucketName) {
        List<String> imageUrls = new ArrayList<>();
        List<MediaDTO> responseMedia = new ArrayList<>();

        if (mediaList != null) {
            for (MediaDTO media : mediaList) {
                String publicUrl = mediaUploader.uploadBase64(
                        media.base64Data(),
                        entityId,
                        media.objectKey(),
                        media.contentType(),
                        bucketName.getName(),
                        entityId
                );
                if (publicUrl != null) {
                    imageUrls.add(publicUrl);
                }
                responseMedia.add(new MediaDTO(media.base64Data(), entityId, media.contentType()));
            }
        }
        return new MediaUploadResult(imageUrls, responseMedia);
    }

    private void deleteMediaForEntity(List<String> imageUrls) {
        if (imageUrls != null) {
            imageUrls.forEach(mediaUploader::deleteMedia);
        }
    }

    private String deriveContentTypeFromKey(String key) {
        if (key.endsWith(".jpg") || key.endsWith(".jpeg")) return "image/jpeg";
        if (key.endsWith(".png")) return "image/png";
        if (key.endsWith(".gif")) return "image/gif";
        if (key.endsWith(".svg")) return "image/svg+xml";
        return "application/octet-stream";
    }

    // Product methods
    @Override
    public List<ResponseProductDTO> getAllProducts() {
        mediaUploader.createBucketIfNotExists(BucketName.PRODUCTS.getName());
        return productRepository.findAll().stream()
                .map(this::mapProductToResponseDTO)
                .sorted(Comparator.comparingInt(ResponseProductDTO::getPriority)
                        .thenComparingLong(ResponseProductDTO::getId))
                .toList();
    }

    @Override
    public List<ResponseProductDTO> getAllProductsByCategoryId(Long categoryId) {
        mediaUploader.createBucketIfNotExists(BucketName.PRODUCTS.getName());
        return productRepository.findAllByCategoryId(categoryId).stream()
                .map(this::mapProductToResponseDTO)
                .sorted(Comparator.comparingInt(ResponseProductDTO::getPriority)
                        .thenComparingLong(ResponseProductDTO::getId))
                .toList();
    }

    @Override
    public List<ResponseProductDTO> getActiveProductsByCategoryId(Long categoryId) {
        mediaUploader.createBucketIfNotExists(BucketName.PRODUCTS.getName());
        return productRepository.findAllByCategoryIdAndActiveTrue(categoryId).stream()
                .map(this::mapProductToResponseDTO)
                .sorted(Comparator.comparingInt(ResponseProductDTO::getPriority)
                        .thenComparingLong(ResponseProductDTO::getId))
                .toList();
    }

    @Override
    public List<ResponseProductDTO> getActiveProductsForMixingByCategoryId(Long categoryId) {
        mediaUploader.createBucketIfNotExists(BucketName.PRODUCTS.getName());
        return productRepository.findAllByCategoryIdAndActiveTrueAndMixableTrue(categoryId).stream()
                .map(this::mapProductToResponseDTO)
                .sorted(Comparator.comparingInt(ResponseProductDTO::getPriority)
                        .thenComparingLong(ResponseProductDTO::getId))
                .toList();
    }

    @Override
    public List<ResponseProductDTO> getActiveProductsForDisplayInProducts() {
        mediaUploader.createBucketIfNotExists(BucketName.PRODUCTS.getName());
        return productRepository.findAllByActiveTrueAndDisplayInProductsTrue().stream()
                .map(this::mapProductToResponseDTO)
                .sorted(Comparator.comparingInt(ResponseProductDTO::getPriority)
                        .thenComparingLong(ResponseProductDTO::getId))
                .toList();
    }

    @Override
    public List<ResponseMixtureDTO> getActiveMixturesForDisplayInProducts() {
        mediaUploader.createBucketIfNotExists(BucketName.MIXTURES.getName());
        return mixtureRepository.findAllByActiveTrueAndDisplayInProductsTrue().stream()
                .map(this::mapMixtureToResponseDTO)
                .sorted(Comparator.comparingInt(ResponseMixtureDTO::getPriority)
                        .thenComparingLong(ResponseMixtureDTO::getId))
                .toList();
    }

    @Override
    public List<ResponseCategoryDTO> getActiveCategoriesForMixing() {
        mediaUploader.createBucketIfNotExists(BucketName.CATEGORIES.getName());
        return categoryRepository.findByActiveTrueAndMixableTrue().stream()
                .map(this::mapCategoryToResponseDTO)
                .sorted(Comparator.comparingInt(ResponseCategoryDTO::getPriority)
                        .thenComparingLong(ResponseCategoryDTO::getId))
                .collect(Collectors.toList());
    }

    @Override
    public List<ResponseProductDTO> createProduct(@Valid List<CreateProductDTO> createProductDTOList) {
        List<CreateProductDTO> validDTOs = createProductDTOList.stream()
                .filter(dto -> !productRepository.existsByName(dto.getName()))
                .collect(Collectors.toList());

        if (validDTOs.isEmpty()) {
            throw new IllegalArgumentException("All products already exist!");
        }

        return validDTOs.stream()
                .map(this::createSingleProduct)
                .sorted(Comparator.comparingInt(ResponseProductDTO::getPriority)
                        .thenComparingLong(ResponseProductDTO::getId))
                .collect(toList());
    }

    private ResponseProductDTO createSingleProduct(CreateProductDTO createProductDTO) {
        Product product = new Product();
        product.setName(createProductDTO.getName());
        product.setPrice(createProductDTO.getPrice());
        product.setDescription(createProductDTO.getDescription());
        product.setActive(createProductDTO.isActive());
        product.setPriority(createProductDTO.getPriority());
        product.setWeightGrams(createProductDTO.getWeightGrams());
        product.setCategory(categoryRepository.findById(createProductDTO.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + createProductDTO.getCategoryId())));
        product.setMixable(createProductDTO.isMixable());
        product.setDisplayInProducts(createProductDTO.isDisplayInProducts());
        product.setUrl(createProductDTO.getUrl());

        // Fix: Use mutable ArrayList
        if (createProductDTO.getTagIds() != null) {
            List<Tag> tags = createProductDTO.getTagIds().stream()
                    .map(tagRepository::findById)
                    .filter(Optional::isPresent)
                    .map(Optional::get)
                    .collect(Collectors.toCollection(ArrayList::new));
            product.setTags(tags);
        } else {
            product.setTags(new ArrayList<>());
        }

        Product savedProduct = productRepository.save(product);
        MediaUploadResult uploadResult = uploadMedia(createProductDTO.getMedia(),
                savedProduct.getId().toString(), BucketName.PRODUCTS);

        savedProduct.setImageUrl(uploadResult.imageUrls());
        Product finalProduct = productRepository.save(savedProduct);

        elasticsearchService.indexProduct(catalogMapper.mapProductToResponseProductDTO(finalProduct));
        return catalogMapper.mapProductToResponseProductDTO(finalProduct, uploadResult.mediaDTOs());
    }

    @Override
    public ResponseProductDTO updateProduct(Long id, UpdateProductDTO updateProductDTO) {
        Product existing = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        if (!updateProductDTO.getName().equals(existing.getName()) &&
                productRepository.existsByName(updateProductDTO.getName())) {
            throw new IllegalArgumentException("Product name already exists: " + updateProductDTO.getName());
        }

        existing.setName(updateProductDTO.getName());
        existing.setDescription(updateProductDTO.getDescription());
        existing.setPrice(updateProductDTO.getPrice());
        existing.setWeightGrams(updateProductDTO.getWeightGrams());
        existing.setActive(updateProductDTO.isActive());
        existing.setPriority(updateProductDTO.getPriority());
        existing.setCategory(categoryRepository.findById(updateProductDTO.getCategoryId()).orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + updateProductDTO.getCategoryId())));
        existing.setMixable(updateProductDTO.isMixable());
        existing.setDisplayInProducts(updateProductDTO.isDisplayInProducts());
        existing.setUrl(updateProductDTO.getUrl());

        // Fix: Use mutable ArrayList
        if (updateProductDTO.getTagIds() != null) {
            List<Tag> tags = tagRepository.findAllById(updateProductDTO.getTagIds());
            existing.getTags().clear();
            existing.getTags().addAll(tags);
        } else {
            existing.getTags().clear();
        }

        deleteMediaForEntity(existing.getImageUrl());
        MediaUploadResult uploadResult = uploadMedia(updateProductDTO.getMedia(),
                id.toString(), BucketName.PRODUCTS);

        existing.getImageUrl().clear();
        existing.getImageUrl().addAll(uploadResult.imageUrls());
        Product savedProduct = productRepository.save(existing);

        elasticsearchService.indexProduct(catalogMapper.mapProductToResponseProductDTO(savedProduct));
        return catalogMapper.mapProductToResponseProductDTO(savedProduct, uploadResult.mediaDTOs());
    }

    @Override
    public ResponseProductDTO getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
        return mapProductToResponseDTO(product);
    }

    @Override
    public void deleteProductById(Long id) {
        productRepository.findById(id).ifPresent(product -> {
            deleteMediaForEntity(product.getImageUrl());
            elasticsearchService.deleteProduct(catalogMapper.mapProductToResponseProductDTO(product));
        });
        productRepository.deleteById(id);
    }

    private ResponseProductDTO mapProductToResponseDTO(Product product) {
        List<MediaDTO> mediaDTOs = retrieveMediaForEntity(product.getId().toString(), BucketName.PRODUCTS);
        return new ResponseProductDTO(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getPriority(),
                product.isActive(),
                mediaDTOs,
                product.getTags().stream().map(catalogMapper::mapTagToResponseTagDTO).toList(),
                product.getCategory().getId(),
                product.getPrice(),
                product.getWeightGrams(),
                product.isMixable(),
                product.isDisplayInProducts(),
                product.getUrl()
        );
    }

    // Mixture methods
    @Override
    public List<ResponseMixtureDTO> getAllMixtures() {
        mediaUploader.createBucketIfNotExists(BucketName.MIXTURES.getName());
        return mixtureRepository.findAll().stream()
                .map(this::mapMixtureToResponseDTO)
                .sorted(Comparator.comparingInt(ResponseMixtureDTO::getPriority)
                        .thenComparingLong(ResponseMixtureDTO::getId))
                .toList();
    }

    @Override
    public List<ResponseMixtureDTO> createMixture(@Valid List<CreateMixtureDTO> createMixtureDTOList) {
        return createMixtureDTOList.stream()
                .map(this::createSingleMixture)
                .sorted(Comparator.comparingInt(ResponseMixtureDTO::getPriority)
                        .thenComparingLong(ResponseMixtureDTO::getId))
                .collect(toList());
    }

    private ResponseMixtureDTO createSingleMixture(CreateMixtureDTO createMixtureDTO) {
        Mixture mixture = new Mixture();
        mixture.setName(createMixtureDTO.getName());
        mixture.setDescription(createMixtureDTO.getDescription());
        mixture.setPriority(createMixtureDTO.getPriority());
        mixture.setActive(createMixtureDTO.isActive());
        mixture.setPrice(createMixtureDTO.getPrice());
        mixture.setWeightGrams(createMixtureDTO.getWeightGrams());
        mixture.setDisplayInProducts(createMixtureDTO.isDisplayInProducts());

        // Fix: Use mutable ArrayLists
        mixture.setProducts(createMixtureDTO.getProductIds().stream()
                .map(productRepository::findById)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .collect(Collectors.toCollection(ArrayList::new)));

        mixture.setTags(createMixtureDTO.getTagIds().stream()
                .map(tagRepository::findById)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .collect(Collectors.toCollection(ArrayList::new)));

        // Fix: Use mutable ArrayList for categories
        Category category = categoryRepository.findById(createMixtureDTO.getCategoryId())
                .orElseThrow(() -> new EntityNotFoundException("Category not found with id: " + createMixtureDTO.getCategoryId()));
        mixture.setCategories(new ArrayList<>(List.of(category)));

        Mixture savedMixture = mixtureRepository.save(mixture);
        MediaUploadResult uploadResult = uploadMedia(createMixtureDTO.getMedia(),
                savedMixture.getId().toString(), BucketName.MIXTURES);

        savedMixture.setImageUrl(uploadResult.imageUrls());
        Mixture finalMixture = mixtureRepository.save(savedMixture);

        elasticsearchService.indexMixture(catalogMapper.mapMixtureToResponseMixtureDTO(finalMixture));
        return mapMixtureToResponseDTO(finalMixture, uploadResult.mediaDTOs());
    }

    @Override
    public ResponseMixtureDTO updateMixture(Long id, UpdateMixtureDTO updateMixtureDTO) {
        Mixture existing = mixtureRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Mixture not found with id: " + id));

        if (!updateMixtureDTO.getName().equals(existing.getName()) &&
                mixtureRepository.existsByName(updateMixtureDTO.getName())) {
            throw new IllegalArgumentException("Mixture name already exists: " + updateMixtureDTO.getName());
        }

        existing.setName(updateMixtureDTO.getName());
        existing.setDescription(updateMixtureDTO.getDescription());
        existing.setPriority(updateMixtureDTO.getPriority());
        existing.setActive(updateMixtureDTO.isActive());
        existing.setPrice(updateMixtureDTO.getPrice());
        existing.setWeightGrams(updateMixtureDTO.getWeightGrams());
        existing.setUrl(updateMixtureDTO.getUrl());
        existing.setDisplayInProducts(updateMixtureDTO.isDisplayInProducts());

        // Fix: Use mutable ArrayLists
        existing.setProducts(updateMixtureDTO.getProductIds().stream()
                .map(productRepository::findById)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .collect(Collectors.toCollection(ArrayList::new)));

        existing.setTags(updateMixtureDTO.getTagIds().stream()
                .map(tagRepository::findById)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .collect(Collectors.toCollection(ArrayList::new)));

        // Fix: Use mutable ArrayList for categories
        Category category = categoryRepository.findById(updateMixtureDTO.getCategoryId())
                .orElseThrow(() -> new EntityNotFoundException("Category not found with id: " + updateMixtureDTO.getCategoryId()));
        existing.setCategories(new ArrayList<>(List.of(category)));

        deleteMediaForEntity(existing.getImageUrl());
        MediaUploadResult uploadResult = uploadMedia(updateMixtureDTO.getMedia(),
                id.toString(), BucketName.MIXTURES);

        existing.setImageUrl(uploadResult.imageUrls());
        Mixture savedMixture = mixtureRepository.save(existing);

        elasticsearchService.indexMixture(catalogMapper.mapMixtureToResponseMixtureDTO(savedMixture));
        return mapMixtureToResponseDTO(savedMixture, uploadResult.mediaDTOs());
    }

    @Override
    public ResponseMixtureDTO getMixtureById(Long id) {
        Mixture mixture = mixtureRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Mixture not found with id: " + id));
        return mapMixtureToResponseDTO(mixture);
    }

    @Override
    public void deleteMixtureById(Long id) {
        mixtureRepository.findById(id).ifPresent(mixture -> {
            deleteMediaForEntity(mixture.getImageUrl());
            elasticsearchService.deleteMixture(catalogMapper.mapMixtureToResponseMixtureDTO(mixture));
        });
        mixtureRepository.deleteById(id);
    }

    private ResponseMixtureDTO mapMixtureToResponseDTO(Mixture mixture) {
        List<MediaDTO> mediaDTOs = retrieveMediaForEntity(mixture.getId().toString(), BucketName.MIXTURES);
        return mapMixtureToResponseDTO(mixture, mediaDTOs);
    }

    private ResponseMixtureDTO mapMixtureToResponseDTO(Mixture mixture, List<MediaDTO> mediaDTOs) {
        return new ResponseMixtureDTO(
                mixture.getId(),
                mixture.getName(),
                mixture.getDescription(),
                mixture.getPriority(),
                mixture.isActive(),
                mediaDTOs,
                mixture.getCategories().get(0).getId(),
                mixture.getProducts().stream().map(catalogMapper::mapProductToResponseProductDTO).toList(),
                mixture.getTags().stream().map(Tag::getId).toList(),
                mixture.getPrice(),
                mixture.getWeightGrams(),
                mixture.isDisplayInProducts(),
                mixture.getUrl()
        );
    }

    // Category methods
    @Override
    public List<ResponseCategoryDTO> getAllCategories() {
        mediaUploader.createBucketIfNotExists(BucketName.CATEGORIES.getName());
        return categoryRepository.findAll().stream()
                .map(this::mapCategoryToResponseDTO)
                .sorted(Comparator.comparingInt(ResponseCategoryDTO::getPriority)
                        .thenComparingLong(ResponseCategoryDTO::getId))
                .collect(Collectors.toList());
    }

    @Override
    public List<ResponseCategoryDTO> getActiveCategories() {
        mediaUploader.createBucketIfNotExists(BucketName.CATEGORIES.getName());
        return categoryRepository.findByActiveTrue().stream()
                .map(this::mapCategoryToResponseDTO)
                .sorted(Comparator.comparingInt(ResponseCategoryDTO::getPriority)
                        .thenComparingLong(ResponseCategoryDTO::getId))
                .collect(Collectors.toList());
    }

    @Override
    public List<ResponseCategoryDTO> createCategory(@Valid List<CreateCategoryDTO> createCategoryDTOList) {
        List<CreateCategoryDTO> validDTOs = createCategoryDTOList.stream()
                .filter(dto -> !categoryRepository.existsByName(dto.getName()))
                .collect(Collectors.toList());

        if (validDTOs.isEmpty()) {
            throw new IllegalArgumentException("All categories already exist!");
        }

        return validDTOs.stream()
                .map(this::createSingleCategory)
                .sorted(Comparator.comparingInt(ResponseCategoryDTO::getPriority)
                        .thenComparingLong(ResponseCategoryDTO::getId))
                .collect(toList());
    }

    private ResponseCategoryDTO createSingleCategory(CreateCategoryDTO createCategoryDTO) {
        Category category = new Category();
        category.setName(createCategoryDTO.getName());
        category.setDescription(createCategoryDTO.getDescription());
        category.setPriority(createCategoryDTO.getPriority());
        category.setActive(createCategoryDTO.isActive());
        category.setMixable(createCategoryDTO.isMixable());
        category.setUrl(createCategoryDTO.getUrl());

        // Fix: Use mutable ArrayList
        if (createCategoryDTO.getTagIds() != null) {
            List<Tag> tags = createCategoryDTO.getTagIds().stream()
                    .map(tagRepository::findById)
                    .filter(Optional::isPresent)
                    .map(Optional::get)
                    .collect(Collectors.toCollection(ArrayList::new));
            category.setTags(tags);
        } else {
            category.setTags(new ArrayList<>());
        }

        Category savedCategory = categoryRepository.save(category);
        MediaUploadResult uploadResult = uploadMedia(createCategoryDTO.getMedia(),
                savedCategory.getId().toString(), BucketName.CATEGORIES);

        savedCategory.setImageUrl(uploadResult.imageUrls());
        Category finalCategory = categoryRepository.save(savedCategory);

        elasticsearchService.indexCategory(catalogMapper.mapCategoryToResponseCategoryDTO(finalCategory));
        return new ResponseCategoryDTO(
                finalCategory.getId(),
                finalCategory.getName(),
                finalCategory.getDescription(),
                finalCategory.getPriority(),
                finalCategory.isActive(),
                uploadResult.mediaDTOs(),
                finalCategory.getTags().stream().map(catalogMapper::mapTagToResponseTagDTO).toList(),
                finalCategory.getUrl()
        );
    }

    @Override
    public ResponseCategoryDTO updateCategory(Long id, UpdateCategoryDTO updateCategoryDTO) {
        Category existing = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));

        categoryRepository.findByName(updateCategoryDTO.getName()).ifPresent(category -> {
            if (!category.getId().equals(id)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Category name already exists: " + updateCategoryDTO.getName());
            }
        });

        deleteMediaForEntity(existing.getImageUrl());
        MediaUploadResult uploadResult = uploadMedia(updateCategoryDTO.getMedia(),
                id.toString(), BucketName.CATEGORIES);

        existing.setName(updateCategoryDTO.getName());
        existing.setDescription(updateCategoryDTO.getDescription());
        existing.setPriority(updateCategoryDTO.getPriority());
        existing.setActive(updateCategoryDTO.isActive());
        existing.setMixable(updateCategoryDTO.isMixable());
        existing.setUrl(updateCategoryDTO.getUrl());
        existing.getImageUrl().addAll(uploadResult.imageUrls());

        // Fix: Use mutable ArrayList
        if (updateCategoryDTO.getTagIds() != null) {
            List<Tag> tags = updateCategoryDTO.getTagIds().stream()
                    .map(tagRepository::findById)
                    .filter(Optional::isPresent)
                    .map(Optional::get)
                    .collect(Collectors.toCollection(ArrayList::new));
            existing.setTags(tags);
        } else {
            existing.setTags(new ArrayList<>());
        }

        Category savedCategory = categoryRepository.save(existing);
        elasticsearchService.indexCategory(catalogMapper.mapCategoryToResponseCategoryDTO(savedCategory));

        return new ResponseCategoryDTO(
                savedCategory.getId(),
                savedCategory.getName(),
                savedCategory.getDescription(),
                savedCategory.getPriority(),
                savedCategory.isActive(),
                uploadResult.mediaDTOs(),
                savedCategory.getTags().stream().map(catalogMapper::mapTagToResponseTagDTO).toList(),
                savedCategory.getUrl()
        );
    }

    @Override
    public ResponseCategoryDTO getCategoryById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
        return mapCategoryToResponseDTO(category);
    }

    @Override
    public void deleteCategoryById(Long id) {
        categoryRepository.findById(id).ifPresent(category -> {
            deleteMediaForEntity(category.getImageUrl());
            elasticsearchService.deleteCategory(catalogMapper.mapCategoryToResponseCategoryDTO(category));
        });
        categoryRepository.deleteById(id);
    }

    private ResponseCategoryDTO mapCategoryToResponseDTO(Category category) {
        List<MediaDTO> mediaDTOs = retrieveMediaForEntity(category.getId().toString(), BucketName.CATEGORIES);
        return new ResponseCategoryDTO(
                category.getId(),
                category.getName(),
                category.getDescription(),
                category.getPriority(),
                category.isActive(),
                mediaDTOs,
                category.getTags().stream().map(catalogMapper::mapTagToResponseTagDTO).toList(),
                category.getUrl()
        );
    }

    // Tag methods
    @Override
    public List<ResponseTagDTO> createTags(@Valid List<CreateTagDTO> createTagDTOList) {
        List<CreateTagDTO> validDTOs = createTagDTOList.stream()
                .filter(dto -> !tagRepository.existsByName(dto.getName()))
                .collect(Collectors.toList());

        if (validDTOs.isEmpty()) {
            throw new IllegalArgumentException("All tags already exist!");
        }

        return validDTOs.stream()
                .map(this::createSingleTag)
                .sorted(Comparator.comparingInt(ResponseTagDTO::getPriority)
                        .thenComparingLong(ResponseTagDTO::getId))
                .collect(toList());
    }

    private ResponseTagDTO createSingleTag(CreateTagDTO createTagDTO) {
        Tag tag = new Tag();
        tag.setName(createTagDTO.getName());
        tag.setDescription(createTagDTO.getDescription());
        tag.setPriority(createTagDTO.getPriority());
        tag.setActive(createTagDTO.isActive());
        tag.setUrl(createTagDTO.getUrl());

        Tag savedTag = tagRepository.save(tag);
        MediaUploadResult uploadResult = uploadMedia(createTagDTO.getMedia(),
                savedTag.getId().toString(), BucketName.TAGS);

        savedTag.setImageUrl(uploadResult.imageUrls());
        Tag finalTag = tagRepository.save(savedTag);

        elasticsearchService.indexTag(catalogMapper.mapTagToResponseTagDTO(finalTag));
        return new ResponseTagDTO(
                finalTag.getId(),
                finalTag.getName(),
                finalTag.getDescription(),
                finalTag.getPriority(),
                finalTag.isActive(),
                uploadResult.mediaDTOs(),
                new ArrayList<>(),
                new ArrayList<>(),
                new ArrayList<>(),
                finalTag.getUrl()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<ResponseTagDTO> getAllTags() {
        mediaUploader.createBucketIfNotExists(BucketName.TAGS.getName());
        return tagRepository.findAll().stream()
                .map(this::mapTagToResponseDTO)
                .sorted(Comparator.comparingInt(ResponseTagDTO::getPriority)
                        .thenComparingLong(ResponseTagDTO::getId))
                .collect(Collectors.toList());
    }

    @Override
    public ResponseTagDTO updateTag(Long id, UpdateTagDTO updateTagDTO) {
        Tag existing = tagRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tag not found with id: " + id));

        tagRepository.findByName(updateTagDTO.getName()).ifPresent(tag -> {
            if (!tag.getId().equals(id)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Tag name already exists: " + updateTagDTO.getName());
            }
        });

        existing.setName(updateTagDTO.getName());
        existing.setDescription(updateTagDTO.getDescription());
        existing.setPriority(updateTagDTO.getPriority());
        existing.setActive(updateTagDTO.isActive());
        existing.setUrl(updateTagDTO.getUrl());

        List<Category> newCategories = updateTagDTO.getCategoryIds() != null
                ? updateTagDTO.getCategoryIds().stream()
                .map(categoryRepository::findById)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .collect(Collectors.toCollection(ArrayList::new))
                : new ArrayList<>();
        List<Category> oldCategories = new ArrayList<>(existing.getCategories());
        existing.setCategories(newCategories);
        for (Category oldCat : oldCategories) {
            if (!newCategories.contains(oldCat)) {
                oldCat.getTags().remove(existing);
            }
        }
        for (Category category : newCategories) {
            if (!category.getTags().contains(existing)) {
                category.getTags().add(existing);
            }
        }

        List<Product> newProducts = updateTagDTO.getProductIds() != null
                ? updateTagDTO.getProductIds().stream()
                .map(productRepository::findById)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .collect(Collectors.toCollection(ArrayList::new))
                : new ArrayList<>();
        List<Product> oldProducts = new ArrayList<>(existing.getProducts());
        existing.setProducts(newProducts);
        for (Product oldProd : oldProducts) {
            if (!newProducts.contains(oldProd)) {
                oldProd.getTags().remove(existing);
            }
        }
        for (Product product : newProducts) {
            if (!product.getTags().contains(existing)) {
                product.getTags().add(existing);
            }
        }

        List<Mixture> newMixtures = updateTagDTO.getMixtureIds() != null
                ? updateTagDTO.getMixtureIds().stream()
                .map(mixtureRepository::findById)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .collect(Collectors.toCollection(ArrayList::new))
                : new ArrayList<>();
        List<Mixture> oldMixtures = new ArrayList<>(existing.getMixtures());
        existing.setMixtures(newMixtures);
        for (Mixture oldMix : oldMixtures) {
            if (!newMixtures.contains(oldMix)) {
                oldMix.getTags().remove(existing);
            }
        }
        for (Mixture mixture : newMixtures) {
            if (!mixture.getTags().contains(existing)) {
                mixture.getTags().add(existing);
            }
        }

        Tag savedTag = tagRepository.save(existing);
        elasticsearchService.indexTag(catalogMapper.mapTagToResponseTagDTO(savedTag));

        return new ResponseTagDTO(
                savedTag.getId(),
                savedTag.getName(),
                savedTag.getDescription(),
                savedTag.getPriority(),
                savedTag.isActive(),
                null,
                savedTag.getCategories().stream().map(catalogMapper::mapCategoryToResponseCategoryDTO).toList(),
                savedTag.getProducts().stream().map(catalogMapper::mapProductToResponseProductDTO).toList(),
                savedTag.getMixtures().stream().map(catalogMapper::mapMixtureToResponseMixtureDTO).toList(),
                savedTag.getUrl()
        );
    }

    @Override
    public ResponseTagDTO getTagById(Long id) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tag not found with id: " + id));
        return mapTagToResponseDTO(tag);
    }

    @Override
    public void deleteTagById(Long id) {
        tagRepository.findById(id).ifPresent(tag -> {
            deleteMediaForEntity(tag.getImageUrl());
            elasticsearchService.deleteTag(catalogMapper.mapTagToResponseTagDTO(tag));
        });
        tagRepository.deleteById(id);
    }

    private ResponseTagDTO mapTagToResponseDTO(Tag tag) {
        List<MediaDTO> mediaDTOs = retrieveMediaForEntity(tag.getId().toString(), BucketName.TAGS);
        return new ResponseTagDTO(
                tag.getId(),
                tag.getName(),
                tag.getDescription(),
                tag.getPriority(),
                tag.isActive(),
                mediaDTOs,
                tag.getCategories().stream().map(catalogMapper::mapCategoryToResponseCategoryDTO).toList(),
                tag.getProducts().stream().map(catalogMapper::mapProductToResponseProductDTO).toList(),
                tag.getMixtures().stream().map(catalogMapper::mapMixtureToResponseMixtureDTO).toList(),
                tag.getUrl()
        );
    }

    // Inventory methods
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
        Integer stock = catalogDomainService.getProductStockFromInventory(productId);
        if (nonNull(stock)) {
            return new ResponseProductStockEvent(productId, stock);
        }
        log.warn("Failed to retrieve stock for product ID: {}", productId);
        return null;
    }

    private record MediaUploadResult(List<String> imageUrls, List<MediaDTO> mediaDTOs) {
    }
}
