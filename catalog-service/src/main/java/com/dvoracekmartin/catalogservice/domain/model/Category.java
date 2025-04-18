package com.dvoracekmartin.catalogservice.domain.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

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

    @ManyToMany(mappedBy = "categories")
    private List<Product> products;

    @ManyToMany(mappedBy = "categories")
    private List<Mixture> mixtures;

    @ManyToMany
    @JoinTable(
            name = "category_tags",
            joinColumns = @JoinColumn(name = "category_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    private List<Tag> tags;
}
