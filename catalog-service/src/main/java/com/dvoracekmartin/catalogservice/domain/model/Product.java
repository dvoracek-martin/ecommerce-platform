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

    @Column(nullable = false)
    private String scentProfile; // e.g., "Floral", "Citrus", "Woody"

    @Column(nullable = false)
    private String botanicalName; // e.g., "Lavandula angustifolia"

    @Column(nullable = false)
    private String extractionMethod; // e.g., "Steam Distillation", "Cold Pressed"

    @Column(nullable = false)
    private String origin; // e.g., "France", "Italy"

    @Column(nullable = false)
    private String usageInstructions; // e.g., "Diffuse", "Topical", "Massage"

    @Column(nullable = false)
    private Integer volumeMl; // Volume in milliliters

    @Column(nullable = false)
    private String warnings; // Safety precautions

    @Column(columnDefinition = "TEXT")
    private String medicinalUse; // e.g., "Pain Relief", "Stress Reduction", "Antiseptic"

    @Column(nullable = false)
    private Double weightGrams; // Weight in grams

    @ElementCollection
    @CollectionTable(name = "product_allergens", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "allergen")
    private List<String> allergens; // List of potential allergens

    @ElementCollection
    @CollectionTable(name = "product_tags", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "tag")
    private List<String> tags; // e.g., "Organic", "Pure", "Therapeutic"
}
