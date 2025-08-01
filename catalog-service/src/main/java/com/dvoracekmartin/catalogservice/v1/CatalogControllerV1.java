package com.dvoracekmartin.catalogservice.v1;

import com.dvoracekmartin.catalogservice.application.dto.category.ResponseCatalogItemDTO;
import com.dvoracekmartin.catalogservice.application.dto.category.ResponseCategoryDTO;
import com.dvoracekmartin.catalogservice.application.dto.mixture.ResponseMixtureDTO;
import com.dvoracekmartin.catalogservice.application.dto.product.ResponseProductDTO;
import com.dvoracekmartin.catalogservice.application.dto.search.ResponseSearchResultDTO;
import com.dvoracekmartin.catalogservice.application.elasticsearch.service.ElasticsearchService;
import com.dvoracekmartin.catalogservice.application.service.CatalogService;
import com.dvoracekmartin.catalogservice.application.service.media.MinIOMediaRetriever;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/catalog/v1")
@Validated
@RequiredArgsConstructor
@Slf4j
public class CatalogControllerV1 {

    private final CatalogService catalogService;
    private final MinIOMediaRetriever mediaRetriever;
    private final ElasticsearchService elasticsearchService;

    @GetMapping("/all-products-and-mixtures")
    public List<ResponseCatalogItemDTO> getAllProductsAndMixtures() {
        return catalogService.getAllProductsAndMixtures();
    }

    @GetMapping("/media")
    public ResponseEntity<byte[]> getMedia(@RequestParam String objectKey, @RequestParam String bucketName) {
        byte[] mediaData = mediaRetriever.retrieveMedia(objectKey, bucketName);

        if (mediaData == null) {
            log.error("Media not found: {}", objectKey);
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                .body(mediaData);
    }

    @GetMapping("/media/list")
    public List<ResponseEntity<byte[]>> listFolderContents(@RequestParam String folder, @RequestParam String bucketName) {
        List<String> mediaKeys = mediaRetriever.listMediaKeysInFolder(folder, "categories");
        List<ResponseEntity<byte[]>> responseEntities = new ArrayList<>();
        for (String mediaKey : mediaKeys) {
            byte[] mediaData = mediaRetriever.retrieveMedia(mediaKey, bucketName);
            if (mediaData != null) {
                responseEntities.add(ResponseEntity.ok()
                        .contentType(MediaType.IMAGE_JPEG)
                        .body(mediaData));
            } else {
                log.error("Media not found: {}", mediaKey);
            }
        }
        log.info("Found {} items in folder '{}'", mediaKeys.size(), folder);
        return responseEntities;
    }

    @GetMapping("/media/list-names")
    public List<String> listNamesFolderContents(@RequestParam String folder, @RequestParam String bucketName) {
        List<String> mediaKeys = mediaRetriever.listMediaKeysInFolder(folder, bucketName);
        log.info("Found {} items in folder '{}'", mediaKeys.size(), folder);
        return mediaKeys;
    }

    @GetMapping("/all-products")
    public List<ResponseProductDTO> getAllProducts() {
        return catalogService.getAllProducts();
    }

    @GetMapping("/all-mixtures")
    public List<ResponseMixtureDTO> getAllMixtures() {
        return catalogService.getAllMixtures();
    }

    @GetMapping("/all-categories")
    public List<ResponseCategoryDTO> getAllCategories() {
        return catalogService.getAllCategories();
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<ResponseProductDTO> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(catalogService.getProductById(id));
    }

    @GetMapping("/mixtures/{id}")
    public ResponseEntity<ResponseMixtureDTO> getMixtureById(@PathVariable Long id) {
        return ResponseEntity.ok(catalogService.getMixtureById(id));
    }

    @GetMapping("/categories/{id}")
    public ResponseEntity<ResponseCategoryDTO> getCategoryById(@PathVariable Long id) {
        return ResponseEntity.ok(catalogService.getCategoryById(id));
    }


    @GetMapping("/search")
    public ResponseSearchResultDTO search(@RequestParam("q") String query) {
        log.info("Search query: {}", query);
        // proof of concept: index all documents before search
        // to be deleted
        elasticsearchService.indexAll();
        // move elasticsearchService to a separate module?
        return elasticsearchService.search(query);
    }
}
