package com.dvoracekmartin.catalogservice.domain.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Mixture {

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
    @CollectionTable(name = "mixture_images", joinColumns = @JoinColumn(name = "mixture_id"))
    @Column(name = "image_url")
    private List<String> images;

    @ManyToMany
    @JoinTable(
            name = "mixture_products",
            joinColumns = @JoinColumn(name = "mixture_id"),
            inverseJoinColumns = @JoinColumn(name = "product_id")
    )
    private List<Product> products; // The products that make up the mixture

    @Column(nullable = false)
    private String intendedUse;

    @Column(nullable = false)
    private String blendingInstructions;

    @Column(nullable = false)
    private String benefits;

    @Column(columnDefinition = "TEXT")
    private String medicinalUse;

    @Column(nullable = false)
    private Double totalWeightGrams;


    @Column(nullable = false)
    private boolean isCustomizable;

    @Column(columnDefinition = "TEXT")
    private String customizationOptions;

    @ManyToMany
    @JoinTable(
            name = "product_categories",
            joinColumns = @JoinColumn(name = "product_id"),
            inverseJoinColumns = @JoinColumn(name = "category_id")
    )
    private List<Category> categories;

    @ManyToMany
    @JoinTable(
            name = "product_tags",
            joinColumns = @JoinColumn(name = "product_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    private List<Tag> tags;
}
