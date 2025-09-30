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
import com.dvoracekmartin.common.event.translation.LocalizedField;
import com.dvoracekmartin.common.event.translation.TranslationGetOrDeleteEvent;
import com.dvoracekmartin.common.event.translation.TranslationObjectsEnum;
import com.dvoracekmartin.common.event.translation.TranslationSaveEvent;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.common.errors.ResourceNotFoundException;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.*;
import java.util.stream.Collectors;

import static java.util.Objects.nonNull;

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
    private final WebClient translationWebClient;


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

    private static TranslationSaveEvent createRequestForTranslationSave(Long elementId, TranslationObjectsEnum elementType, Map<String, LocalizedField> localizedFieldMap) {
        return new TranslationSaveEvent(
                UUID.randomUUID().toString(),
                elementType,
                elementId,
                localizedFieldMap
        );
    }

    private static TranslationGetOrDeleteEvent createRequestForTranslationGetOrDelete(Long elementId, TranslationObjectsEnum elementType) {
        return new TranslationGetOrDeleteEvent(
                elementType,
                elementId
        );
    }

    private void saveOrUpdateTranslation(TranslationSaveEvent translationSaveEvent) {
        translationWebClient.post()
                .uri("/save")
                .bodyValue(translationSaveEvent)
                .retrieve()
                .bodyToMono(Void.class)
                .block();
    }

    private Map<String, LocalizedField> getTranslationMap(TranslationGetOrDeleteEvent translationGetOrDeleteEvent) {
        return translationWebClient.post()
                .uri("/get")
                .bodyValue(translationGetOrDeleteEvent)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, LocalizedField>>() {
                })
                .block();
    }

    private Map<String, LocalizedField> deleteTranslationMap(TranslationGetOrDeleteEvent translationGetOrDeleteEvent) {
        return translationWebClient.post()
                .uri("/delete")
                .bodyValue(translationGetOrDeleteEvent)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, LocalizedField>>() {
                })
                .block();
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
                .map(responseCategoryDTO -> mapCategoryToResponseDTO(responseCategoryDTO))
                .sorted(Comparator.comparingInt(ResponseCategoryDTO::getPriority)
                        .thenComparingLong(ResponseCategoryDTO::getId))
                .collect(Collectors.toList());
    }

    @Override
    public ResponseProductDTO createProduct(@Valid CreateProductDTO createProductDTO) {
        Product product = new Product();
        product.setActive(createProductDTO.isActive());
        product.setPrice(createProductDTO.getPrice());
        product.setPriority(createProductDTO.getPriority());
        product.setWeightGrams(createProductDTO.getWeightGrams());
        product.setCategory(categoryRepository.findById(createProductDTO.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + createProductDTO.getCategoryId())));
        product.setMixable(createProductDTO.isMixable());
        product.setDisplayInProducts(createProductDTO.isDisplayInProducts());
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

        // Save product to get ID
        Product savedProduct = productRepository.save(product);

        MediaUploadResult uploadResult = uploadMedia(createProductDTO.getMedia(),
                savedProduct.getId().toString(), BucketName.PRODUCTS);
        savedProduct.setImageUrl(uploadResult.imageUrls());
        Product finalProduct = productRepository.save(savedProduct);

        // save translated strings
        saveOrUpdateTranslation(createRequestForTranslationSave(product.getId(), TranslationObjectsEnum.PRODUCT, createProductDTO.getLocalizedFields()));

        // Index in Elasticsearch
        // elasticsearchService.indexProduct(catalogMapper.mapProductToResponseProductDTO(finalProduct));

        Map<String, LocalizedField> translationMap = getTranslationMap(createRequestForTranslationGetOrDelete(finalProduct.getId(), TranslationObjectsEnum.PRODUCT));

        return catalogMapper.mapProductToResponseProductDTO(finalProduct, uploadResult.mediaDTOs(), translationMap);
    }

    @Override
    public ResponseProductDTO updateProduct(Long id, UpdateProductDTO updateProductDTO) {
        Product existingProduct = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        existingProduct.setWeightGrams(updateProductDTO.getWeightGrams());
        existingProduct.setCategory(categoryRepository.findById(updateProductDTO.getCategoryId()).orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + updateProductDTO.getCategoryId())));
        existingProduct.setActive(updateProductDTO.isActive());
        existingProduct.setMixable(updateProductDTO.isMixable());
        existingProduct.setDisplayInProducts(updateProductDTO.isDisplayInProducts());
        existingProduct.setPriority(updateProductDTO.getPriority());
        existingProduct.setPrice(updateProductDTO.getPrice());
        if (updateProductDTO.getTagIds() != null) {
            List<Tag> tags = tagRepository.findAllById(updateProductDTO.getTagIds());
            existingProduct.getTags().clear();
            existingProduct.getTags().addAll(tags);
        } else {
            existingProduct.getTags().clear();
        }

        deleteMediaForEntity(existingProduct.getImageUrl());
        MediaUploadResult uploadResult = uploadMedia(updateProductDTO.getMedia(),
                id.toString(), BucketName.PRODUCTS);

        existingProduct.getImageUrl().clear();
        existingProduct.getImageUrl().addAll(uploadResult.imageUrls());

        TranslationSaveEvent request = createRequestForTranslationSave(existingProduct.getId(), TranslationObjectsEnum.PRODUCT, updateProductDTO.getLocalizedFields());
        saveOrUpdateTranslation(request);

        Product savedProduct = productRepository.save(existingProduct);

        elasticsearchService.indexProduct(catalogMapper.mapProductToResponseProductDTO(savedProduct));

        Map<String, LocalizedField> translationMap = getTranslationMap(createRequestForTranslationGetOrDelete(savedProduct.getId(), TranslationObjectsEnum.PRODUCT));
        return catalogMapper.mapProductToResponseProductDTO(savedProduct, uploadResult.mediaDTOs(), translationMap);
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

        TranslationGetOrDeleteEvent request = createRequestForTranslationGetOrDelete(id, TranslationObjectsEnum.PRODUCT);
        deleteTranslationMap(request);

        productRepository.deleteById(id);
    }

    private ResponseProductDTO mapProductToResponseDTO(Product product) {
        List<MediaDTO> mediaDTOs = retrieveMediaForEntity(product.getId().toString(), BucketName.PRODUCTS);
        return new ResponseProductDTO(
                product.getId(),
                getTranslationMap(createRequestForTranslationGetOrDelete(product.getId(), TranslationObjectsEnum.PRODUCT)),
                product.getPriority(),
                product.isActive(),
                mediaDTOs,
                product.getTags().stream().map(catalogMapper::mapTagToResponseTagDTO).toList(),
                product.getCategory().getId(),
                product.getPrice(),
                product.getWeightGrams(),
                product.isMixable(),
                product.isDisplayInProducts()
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
    public ResponseMixtureDTO createMixture(@Valid CreateMixtureDTO createMixtureDTO) {
        Mixture mixture = new Mixture();
        mixture.setPriority(createMixtureDTO.getPriority());
        mixture.setName(createMixtureDTO.getName());
        mixture.setActive(createMixtureDTO.isActive());
        mixture.setPrice(createMixtureDTO.getPrice());
        mixture.setWeightGrams(createMixtureDTO.getWeightGrams());
        mixture.setDisplayInProducts(createMixtureDTO.isDisplayInProducts());
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

        Category category = categoryRepository.findById(createMixtureDTO.getCategoryId())
                .orElseThrow(() -> new EntityNotFoundException("Category not found with id: " + createMixtureDTO.getCategoryId()));
        mixture.setCategory(category);

        Mixture savedMixture = mixtureRepository.save(mixture);
        MediaUploadResult uploadResult = uploadMedia(createMixtureDTO.getMedia(),
                savedMixture.getId().toString(), BucketName.MIXTURES);

        savedMixture.setImageUrl(uploadResult.imageUrls());

        // if the mixture doesn't have localized fields, it's because it's customer-made and there is nothing to be translated
        if (createMixtureDTO.getLocalizedFields() != null) {
            TranslationSaveEvent request = createRequestForTranslationSave(savedMixture.getId(), TranslationObjectsEnum.MIXTURE, createMixtureDTO.getLocalizedFields());
            saveOrUpdateTranslation(request);
        }

        Mixture finalMixture = mixtureRepository.save(savedMixture);

        // elasticsearchService.indexMixture(catalogMapper.mapMixtureToResponseMixtureDTO(finalMixture));

        Map<String, LocalizedField> translationMap = getTranslationMap(createRequestForTranslationGetOrDelete(finalMixture.getId(), TranslationObjectsEnum.MIXTURE));
        return catalogMapper.mapMixtureToResponseMixtureDTO(finalMixture, uploadResult.mediaDTOs(), translationMap);
    }

    @Override
    public ResponseMixtureDTO updateMixture(Long id, UpdateMixtureDTO updateMixtureDTO) {
        Mixture existingMixture = mixtureRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Mixture not found with id: " + id));

        existingMixture.setName(updateMixtureDTO.getName());
        existingMixture.setActive(updateMixtureDTO.isActive());
        existingMixture.setPrice(updateMixtureDTO.getPrice());
        existingMixture.setWeightGrams(updateMixtureDTO.getWeightGrams());
        existingMixture.setDisplayInProducts(updateMixtureDTO.isDisplayInProducts());

        existingMixture.setProducts(updateMixtureDTO.getProductIds().stream()
                .map(productRepository::findById)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .collect(Collectors.toCollection(ArrayList::new)));

        existingMixture.setTags(updateMixtureDTO.getTagIds().stream()
                .map(tagRepository::findById)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .collect(Collectors.toCollection(ArrayList::new)));

        Category category = categoryRepository.findById(updateMixtureDTO.getCategoryId())
                .orElseThrow(() -> new EntityNotFoundException("Category not found with id: " + updateMixtureDTO.getCategoryId()));
        existingMixture.setCategory(category);

        deleteMediaForEntity(existingMixture.getImageUrl());
        MediaUploadResult uploadResult = uploadMedia(updateMixtureDTO.getMedia(),
                id.toString(), BucketName.MIXTURES);

        existingMixture.setImageUrl(uploadResult.imageUrls());

        // if the mixture doesn't have localized fields, it's because it's customer-made and there is nothing to be translated
        if (updateMixtureDTO.getLocalizedFields() != null) {
            TranslationSaveEvent request = createRequestForTranslationSave(existingMixture.getId(), TranslationObjectsEnum.MIXTURE, updateMixtureDTO.getLocalizedFields());
            saveOrUpdateTranslation(request);
        }

        Mixture savedMixture = mixtureRepository.save(existingMixture);

        // elasticsearchService.indexMixture(catalogMapper.mapMixtureToResponseMixtureDTO(savedMixture));
        
        Map<String, LocalizedField> translationMap = getTranslationMap(createRequestForTranslationGetOrDelete(savedMixture.getId(), TranslationObjectsEnum.MIXTURE));
        return catalogMapper.mapMixtureToResponseMixtureDTO(savedMixture, uploadResult.mediaDTOs(), translationMap);
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

        TranslationGetOrDeleteEvent request = createRequestForTranslationGetOrDelete(id, TranslationObjectsEnum.MIXTURE);
        deleteTranslationMap(request);

        mixtureRepository.deleteById(id);
    }

    private ResponseMixtureDTO mapMixtureToResponseDTO(Mixture mixture) {
        return new ResponseMixtureDTO(
                mixture.getId(),
                mixture.getName(),
                getTranslationMap(createRequestForTranslationGetOrDelete(mixture.getId(), TranslationObjectsEnum.MIXTURE)),
                mixture.getPriority(),
                mixture.isActive(),
                retrieveMediaForEntity(mixture.getId().toString(), BucketName.MIXTURES),
                mixture.getCategory().getId(),
                mixture.getProducts().stream().map(catalogMapper::mapProductToResponseProductDTO).toList(),
                mixture.getTags().stream().map(Tag::getId).toList(),
                mixture.getPrice(),
                mixture.getWeightGrams(),
                mixture.isDisplayInProducts()
        );
    }

    // Category methods
    @Override
    public List<ResponseCategoryDTO> getAllCategories() {
        mediaUploader.createBucketIfNotExists(BucketName.CATEGORIES.getName());
        return categoryRepository.findAll().stream()
                .map(responseCategoryDTO -> mapCategoryToResponseDTO(responseCategoryDTO))
                .sorted(Comparator.comparingInt(ResponseCategoryDTO::getPriority)
                        .thenComparingLong(ResponseCategoryDTO::getId))
                .collect(Collectors.toList());
    }

    @Override
    public List<ResponseCategoryDTO> getActiveCategories() {
        mediaUploader.createBucketIfNotExists(BucketName.CATEGORIES.getName());

        return categoryRepository.findByActiveTrue().stream()
                .map(responseCategoryDTO -> mapCategoryToResponseDTO(responseCategoryDTO))
                .sorted(Comparator.comparingInt(ResponseCategoryDTO::getPriority)
                        .thenComparingLong(ResponseCategoryDTO::getId))
                .collect(Collectors.toList());
    }


    // can be void in the future, now returning DTO just for debugging
    @Override
    public ResponseCategoryDTO createCategory(@Valid CreateCategoryDTO createCategoryDTO) {
        Category category = new Category();
        category.setPriority(createCategoryDTO.getPriority());
        category.setActive(createCategoryDTO.isActive());
        category.setMixable(createCategoryDTO.isMixable());

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

        // Save the category first to get an ID
        Category savedCategory = categoryRepository.save(category);

        // Upload media
        MediaUploadResult uploadResult = uploadMedia(createCategoryDTO.getMedia(),
                savedCategory.getId().toString(), BucketName.CATEGORIES);
        savedCategory.setImageUrl(uploadResult.imageUrls());
        Category finalCategory = categoryRepository.save(savedCategory);

        // save translated strings
        saveOrUpdateTranslation(createRequestForTranslationSave(category.getId(), TranslationObjectsEnum.CATEGORY, createCategoryDTO.getLocalizedFields()));

        // Index in Elasticsearch
        // elasticsearchService.indexCategory(catalogMapper.mapCategoryToResponseCategoryDTO(finalCategory));

        Map<String, LocalizedField> translationMap = getTranslationMap(createRequestForTranslationGetOrDelete(finalCategory.getId(), TranslationObjectsEnum.CATEGORY));

        return catalogMapper.mapCategoryToResponseCategoryDTO(finalCategory, uploadResult.mediaDTOs, translationMap);
    }

    @Override
    public ResponseCategoryDTO updateCategory(Long id, UpdateCategoryDTO updateCategoryDTO) {
        Category existingCategory = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));

        deleteMediaForEntity(existingCategory.getImageUrl());
        MediaUploadResult uploadResult = uploadMedia(updateCategoryDTO.getMedia(),
                id.toString(), BucketName.CATEGORIES);

        TranslationSaveEvent request = createRequestForTranslationSave(existingCategory.getId(), TranslationObjectsEnum.CATEGORY, updateCategoryDTO.getLocalizedFields());
        saveOrUpdateTranslation(request);

        existingCategory.setPriority(updateCategoryDTO.getPriority());
        existingCategory.setActive(updateCategoryDTO.isActive());
        existingCategory.setMixable(updateCategoryDTO.isMixable());
        existingCategory.getImageUrl().addAll(uploadResult.imageUrls());

        if (updateCategoryDTO.getTagIds() != null) {
            List<Tag> tags = updateCategoryDTO.getTagIds().stream()
                    .map(tagRepository::findById)
                    .filter(Optional::isPresent)
                    .map(Optional::get)
                    .collect(Collectors.toCollection(ArrayList::new));
            existingCategory.setTags(tags);
        } else {
            existingCategory.setTags(new ArrayList<>());
        }

        Category savedCategory = categoryRepository.save(existingCategory);

        // elasticsearchService.indexCategory(catalogMapper.mapCategoryToResponseCategoryDTO(savedCategory));

        Map<String, LocalizedField> translationMap = getTranslationMap(createRequestForTranslationGetOrDelete(savedCategory.getId(), TranslationObjectsEnum.CATEGORY));

        return catalogMapper.mapCategoryToResponseCategoryDTO(savedCategory, uploadResult.mediaDTOs, translationMap);
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

        TranslationGetOrDeleteEvent request = createRequestForTranslationGetOrDelete(id, TranslationObjectsEnum.CATEGORY);
        deleteTranslationMap(request);

        categoryRepository.deleteById(id);
    }

    private ResponseCategoryDTO mapCategoryToResponseDTO(Category category) {
        List<MediaDTO> mediaDTOs = retrieveMediaForEntity(category.getId().toString(), BucketName.CATEGORIES);
        return new ResponseCategoryDTO(
                category.getId(),
                getTranslationMap(createRequestForTranslationGetOrDelete(category.getId(), TranslationObjectsEnum.CATEGORY)),
                category.getPriority(),
                category.isActive(),
                mediaDTOs,
                category.getTags().stream().map(this::mapTagToResponseDTO).toList(),
                category.isMixable()
        );
    }

    // Tag methods
    @Override
    public ResponseTagDTO createTag(@Valid CreateTagDTO createTagDTO) {
        Tag tag = new Tag();
        tag.setPriority(createTagDTO.getPriority());
        tag.setActive(createTagDTO.isActive());

        Tag finalTag = tagRepository.save(tag);

        saveOrUpdateTranslation(createRequestForTranslationSave(tag.getId(), TranslationObjectsEnum.TAG, createTagDTO.getLocalizedFields()));

        // Index in Elasticsearch
        // elasticsearchService.indexTag(catalogMapper.mapTagToResponseTagDTO(finalTag));

        Map<String, LocalizedField> translationMap = getTranslationMap(createRequestForTranslationGetOrDelete(finalTag.getId(), TranslationObjectsEnum.TAG));
        finalTag.setCategories(new ArrayList<>());
        finalTag.setProducts(new ArrayList<>());
        finalTag.setMixtures(new ArrayList<>());
        return catalogMapper.mapTagToResponseTagDTO(finalTag, translationMap);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ResponseTagDTO> getAllTags() {
        return tagRepository.findAll().stream()
                .map(this::mapTagToResponseDTO)
                .sorted(Comparator.comparingInt(ResponseTagDTO::getPriority)
                        .thenComparingLong(ResponseTagDTO::getId))
                .collect(Collectors.toList());
    }

    @Override
    public ResponseTagDTO updateTag(Long id, UpdateTagDTO updateTagDTO) {
        Tag existingTag = tagRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tag not found with id: " + id));

        existingTag.setPriority(updateTagDTO.getPriority());
        existingTag.setActive(updateTagDTO.isActive());

        List<Category> newCategories = updateTagDTO.getCategoryIds() != null
                ? updateTagDTO.getCategoryIds().stream()
                .map(categoryRepository::findById)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .collect(Collectors.toCollection(ArrayList::new))
                : new ArrayList<>();
        List<Category> oldCategories = new ArrayList<>(existingTag.getCategories());
        existingTag.setCategories(newCategories);
        for (Category oldCat : oldCategories) {
            if (!newCategories.contains(oldCat)) {
                oldCat.getTags().remove(existingTag);
            }
        }
        for (Category category : newCategories) {
            if (!category.getTags().contains(existingTag)) {
                category.getTags().add(existingTag);
            }
        }

        List<Product> newProducts = updateTagDTO.getProductIds() != null
                ? updateTagDTO.getProductIds().stream()
                .map(productRepository::findById)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .collect(Collectors.toCollection(ArrayList::new))
                : new ArrayList<>();
        List<Product> oldProducts = new ArrayList<>(existingTag.getProducts());
        existingTag.setProducts(newProducts);
        for (Product oldProd : oldProducts) {
            if (!newProducts.contains(oldProd)) {
                oldProd.getTags().remove(existingTag);
            }
        }
        for (Product product : newProducts) {
            if (!product.getTags().contains(existingTag)) {
                product.getTags().add(existingTag);
            }
        }

        List<Mixture> newMixtures = updateTagDTO.getMixtureIds() != null
                ? updateTagDTO.getMixtureIds().stream()
                .map(mixtureRepository::findById)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .collect(Collectors.toCollection(ArrayList::new))
                : new ArrayList<>();
        List<Mixture> oldMixtures = new ArrayList<>(existingTag.getMixtures());
        existingTag.setMixtures(newMixtures);
        for (Mixture oldMix : oldMixtures) {
            if (!newMixtures.contains(oldMix)) {
                oldMix.getTags().remove(existingTag);
            }
        }
        for (Mixture mixture : newMixtures) {
            if (!mixture.getTags().contains(existingTag)) {
                mixture.getTags().add(existingTag);
            }
        }


        saveOrUpdateTranslation(createRequestForTranslationSave(existingTag.getId(), TranslationObjectsEnum.TAG, updateTagDTO.getLocalizedFields()));

        Tag finalTag = tagRepository.save(existingTag);

        //elasticsearchService.indexTag(catalogMapper.mapTagToResponseTagDTO(savedTag));

        Map<String, LocalizedField> translationMap = getTranslationMap(createRequestForTranslationGetOrDelete(finalTag.getId(), TranslationObjectsEnum.TAG));

        return catalogMapper.mapTagToResponseTagDTO(finalTag, translationMap);
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

        TranslationGetOrDeleteEvent request = createRequestForTranslationGetOrDelete(id, TranslationObjectsEnum.TAG);
        deleteTranslationMap(request);

        tagRepository.deleteById(id);
    }

    private ResponseTagDTO mapTagToResponseDTO(Tag tag) {
        return new ResponseTagDTO(
                tag.getId(),
                getTranslationMap(createRequestForTranslationGetOrDelete(tag.getId(), TranslationObjectsEnum.TAG)),
                tag.getPriority(),
                tag.isActive(),
                null,
                tag.getCategories().stream().map(catalogMapper::mapCategoryToResponseCategoryDTO).toList(),
                tag.getProducts().stream().map(catalogMapper::mapProductToResponseProductDTO).toList(),
                tag.getMixtures().stream().map(catalogMapper::mapMixtureToResponseMixtureDTO).toList()
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
