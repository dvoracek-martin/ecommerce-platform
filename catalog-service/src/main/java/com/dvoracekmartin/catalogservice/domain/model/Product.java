package com.dvoracekmartin.catalogservice.domain.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private BigDecimal price;

    @ElementCollection
    @CollectionTable(name = "product_images", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "image_url")
    private List<String> images;

    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;

    @Column
    private String scentProfile;

    @Column
    private String botanicalName;

    @Column
    private String extractionMethod;

    @Column
    private String origin;

    @Column
    private String usageInstructions;


    @Column
    private String warnings;

    @Column(columnDefinition = "TEXT")
    private String medicinalUse;

    @Column
    private Double weightGrams;

    @Column
    private Integer volumeMl;

    @ElementCollection
    @CollectionTable(name = "product_allergens", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "allergen")
    private List<String> allergens;

    @ManyToMany
    @JoinTable(
            name = "mixture_categories",
            joinColumns = @JoinColumn(name = "mixture_id"),
            inverseJoinColumns = @JoinColumn(name = "category_id")
    )
    private List<Category> categories;

    @ManyToMany
    @JoinTable(
            name = "mixture_tags",
            joinColumns = @JoinColumn(name = "mixture_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    private List<Tag> tags;

}
