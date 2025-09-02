package com.dvoracekmartin.catalogservice.application.elasticsearch.service;

import com.dvoracekmartin.common.dto.category.ResponseCategoryDTO;
import com.dvoracekmartin.common.dto.mixture.ResponseMixtureDTO;
import com.dvoracekmartin.common.dto.product.ResponseProductDTO;
import com.dvoracekmartin.catalogservice.application.dto.search.ResponseSearchResultDTO;
import com.dvoracekmartin.common.dto.tag.ResponseTagDTO;
import com.dvoracekmartin.catalogservice.application.elasticsearch.document.CategoryDocument;
import com.dvoracekmartin.catalogservice.application.elasticsearch.document.MixtureDocument;
import com.dvoracekmartin.catalogservice.application.elasticsearch.document.ProductDocument;
import com.dvoracekmartin.catalogservice.application.elasticsearch.document.TagDocument;
import com.dvoracekmartin.catalogservice.application.elasticsearch.repository.CategoryElasticsearchRepository;
import com.dvoracekmartin.catalogservice.application.elasticsearch.repository.MixtureElasticsearchRepository;
import com.dvoracekmartin.catalogservice.application.elasticsearch.repository.ProductElasticsearchRepository;
import com.dvoracekmartin.catalogservice.application.elasticsearch.repository.TagElasticsearchRepository;
import com.dvoracekmartin.catalogservice.application.elasticsearch.utils.ElasticsearchMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ElasticsearchServiceImpl implements ElasticsearchService {

    private final CategoryElasticsearchRepository categoryElasticsearchRepository;
    private final ProductElasticsearchRepository productsElasticsearchRepository;
    private final MixtureElasticsearchRepository mixtureElasticsearchRepository;
    private final TagElasticsearchRepository tagElasticsearchRepository;
    private final ElasticsearchMapper elasticsearchMapper;

    /**
     * Helper method to filter distinct elements by a key extractor
     */
    private <T> java.util.function.Predicate<T> distinctById(java.util.function.Function<? super T, ?> keyExtractor) {
        java.util.Set<Object> seen = new java.util.concurrent.ConcurrentSkipListSet<>();
        return t -> seen.add(keyExtractor.apply(t));
    }

    public void indexAll(List<ResponseCategoryDTO> categories,
                         List<ResponseProductDTO> products,
                         List<ResponseMixtureDTO> mixtures,
                         List<ResponseTagDTO> tags
    ) {
        categoryElasticsearchRepository.deleteAll();
        List<CategoryDocument> categoryDocs = categories.stream().map(elasticsearchMapper::mapResponseCategoryDTOToCategoryDocument).toList();
        categoryElasticsearchRepository.saveAll(categoryDocs);

        List<ProductDocument> productDocs = products
                .stream()
                .map(elasticsearchMapper::mapResponseProductDTOToProductDocument)
                .toList();

        productsElasticsearchRepository.saveAll(productDocs);

        List<MixtureDocument> mixtureDocs = mixtures.stream()
                .map(elasticsearchMapper::mapResponseMixtureDTOToMixtureDocument)
                .toList();
        mixtureElasticsearchRepository.saveAll(mixtureDocs);

        List<TagDocument> tagDocs = tags.stream()
                .map(elasticsearchMapper::mapResponseTagDTOToTagDocument)
                .toList();
        tagElasticsearchRepository.saveAll(tagDocs);
    }

    @Override
    public ResponseSearchResultDTO searchProductsAndMixtures(String query) {
        List<ResponseProductDTO> products = productsElasticsearchRepository
                .findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(query, query)
                .stream()
                .map(this::toResponseProductDTO)
                .filter(distinctById(ResponseProductDTO::getId))
                .toList();

        List<ResponseMixtureDTO> mixtures = mixtureElasticsearchRepository
                .findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(query, query)
                .stream()
                .map(this::toResponseMixtureDTO)
                .filter(distinctById(ResponseMixtureDTO::getId))
                .toList();

        return new ResponseSearchResultDTO(products, new ArrayList<>(), mixtures, new ArrayList<>());
    }


    public ResponseSearchResultDTO search(String query) {
        List<ResponseCategoryDTO> categories = categoryElasticsearchRepository.findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(query, query)
                .stream()
                .map(this::toResponseCategoryDTO)
                .toList();

        List<ResponseProductDTO> products = productsElasticsearchRepository.findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(query, query)
                .stream()
                .map(this::toResponseProductDTO)
                .toList();

        List<ResponseMixtureDTO> mixtures = mixtureElasticsearchRepository.findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(query, query)
                .stream()
                .map(this::toResponseMixtureDTO)
                .toList();

        List<ResponseTagDTO> tags = tagElasticsearchRepository.findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(query, query)
                .stream()
                .map(this::toResponseTagDTO)
                .toList();

        return new ResponseSearchResultDTO(products, categories, mixtures, tags);
    }

    public void indexProduct(ResponseProductDTO responseProductDTO) {
        productsElasticsearchRepository.save(elasticsearchMapper.mapResponseProductDTOToProductDocument(responseProductDTO));
    }

    @Override
    public void indexCategory(ResponseCategoryDTO responseCategoryDTO) {
        categoryElasticsearchRepository.save(elasticsearchMapper.mapResponseCategoryDTOToCategoryDocument(responseCategoryDTO));
    }

    @Override
    public void indexMixture(ResponseMixtureDTO responseMixtureDTO) {
        mixtureElasticsearchRepository.save(elasticsearchMapper.mapResponseMixtureDTOToMixtureDocument(responseMixtureDTO));
    }

    @Override
    public void indexTag(ResponseTagDTO responseTagDTO) {
        tagElasticsearchRepository.save(elasticsearchMapper.mapResponseTagDTOToTagDocument(responseTagDTO));
    }

    @Override
    public void deleteProduct(ResponseProductDTO responseProductDTO) {
        productsElasticsearchRepository.delete(elasticsearchMapper.mapResponseProductDTOToProductDocument(responseProductDTO));
    }

    @Override
    public void deleteCategory(ResponseCategoryDTO responseCategoryDTO) {
        categoryElasticsearchRepository.delete(elasticsearchMapper.mapResponseCategoryDTOToCategoryDocument(responseCategoryDTO));
    }

    @Override
    public void deleteMixture(ResponseMixtureDTO responseMixtureDTO) {
        mixtureElasticsearchRepository.delete(elasticsearchMapper.mapResponseMixtureDTOToMixtureDocument(responseMixtureDTO));
    }

    @Override
    public void deleteTag(ResponseTagDTO responseTagDTO) {
        tagElasticsearchRepository.delete(elasticsearchMapper.mapResponseTagDTOToTagDocument(responseTagDTO));

    }

    private ResponseCategoryDTO toResponseCategoryDTO(CategoryDocument doc) {
        return elasticsearchMapper.mapCategoryDocumentToResponseCategoryDTO(doc);
    }

    private ResponseProductDTO toResponseProductDTO(ProductDocument doc) {
        return elasticsearchMapper.mapProductDocumentToResponseProductDTO(doc);
    }


    private ResponseMixtureDTO toResponseMixtureDTO(MixtureDocument doc) {
        return elasticsearchMapper.mapMixtureDocumentToResponseMixtureDTO(doc);
    }

    private ResponseTagDTO toResponseTagDTO(TagDocument doc) {
        return elasticsearchMapper.mapTagDocumentToResponseTagDTO(doc);
    }

}
