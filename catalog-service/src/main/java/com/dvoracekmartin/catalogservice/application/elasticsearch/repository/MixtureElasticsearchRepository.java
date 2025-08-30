package com.dvoracekmartin.catalogservice.application.elasticsearch.repository;

import com.dvoracekmartin.catalogservice.application.elasticsearch.document.MixtureDocument;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;

import java.util.List;

@Lazy
public interface MixtureElasticsearchRepository extends ElasticsearchRepository<MixtureDocument, String> {
    List<MixtureDocument> findByNameContainingIgnoreCase(String name);

    List<MixtureDocument> findByDescriptionContainingIgnoreCase(String description);

    List<MixtureDocument> findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(String name, String description);
}
