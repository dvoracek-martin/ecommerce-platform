package com.dvoracekmartin.catalogservice.domain.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String categoryType;

    @ElementCollection
    @CollectionTable(name = "category_images", joinColumns = @JoinColumn(name = "category_id"))
    @Column(name = "image_url")
    private List<String> images;
}
