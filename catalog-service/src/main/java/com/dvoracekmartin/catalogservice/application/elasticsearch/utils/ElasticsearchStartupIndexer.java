package com.dvoracekmartin.catalogservice.application.elasticsearch.utils;

import com.dvoracekmartin.catalogservice.application.elasticsearch.service.ElasticsearchService;
import com.dvoracekmartin.catalogservice.application.service.CatalogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ElasticsearchStartupIndexer {

    private final CatalogService catalogService;
    private final ElasticsearchService elasticsearchService;

    @EventListener(ApplicationReadyEvent.class)
    public void reindexAllDataOnStartup() {
        try {
            log.info("Starting Elasticsearch reindexing process...");

            // Retrieve all data from the database
            log.info("Fetching all products...");
            var products = catalogService.getAllProducts();

            log.info("Fetching all mixtures...");
            var mixtures = catalogService.getAllMixtures();

            log.info("Fetching all categories...");
            var categories = catalogService.getAllCategories();

            log.info("Fetching all tags...");
            var tags = catalogService.getAllTags();

            // Index all data in Elasticsearch
            log.info("Indexing all data in Elasticsearch...");
            elasticsearchService.indexAll(categories, products, mixtures, tags);

            log.info("Elasticsearch reindexing completed successfully. " +
                            "Indexed: {} products, {} mixtures, {} categories, {} tags",
                    products.size(), mixtures.size(), categories.size(), tags.size());
        } catch (Exception e) {
            log.error("Failed to reindex data in Elasticsearch on application startup", e);
        }
    }
}
