package com.dvoracekmartin.catalogservice.domain.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
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
    private String intendedUse; // e.g., "Relaxation", "Focus", "Sleep"

    @Column(nullable = false)
    private String blendingInstructions; // How the mixture is created

    @Column(nullable = false)
    private String benefits; // What the mixture is used for

    @Column(columnDefinition = "TEXT")
    private String medicinalUse; // e.g., "Pain Relief", "Stress Reduction", "Antiseptic"

    @Column(nullable = false)
    private Double totalWeightGrams; // Total weight of the mixture in grams

    @ElementCollection
    @CollectionTable(name = "mixture_tags", joinColumns = @JoinColumn(name = "mixture_id"))
    @Column(name = "tag")
    private List<String> tags; // e.g., "Pre-made", "Customizable", "Seasonal"

    @Column(nullable = false)
    private boolean isCustomizable; // Indicates if the user can customize the mixture

    @Column(columnDefinition = "TEXT")
    private String customizationOptions; // e.g., "Add 5ml of Lavender", "Remove 2ml of Peppermint"

}
