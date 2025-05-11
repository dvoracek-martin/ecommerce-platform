package com.dvoracekmartin.catalogservice.domain.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;

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

    @ElementCollection
    @CollectionTable(name = "category_images", joinColumns = @JoinColumn(name = "category_id"))
    @Column(name = "image_url")
    private List<String> images;

    @ManyToMany(mappedBy = "categories")
    @JsonBackReference
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Product> products;

    @ManyToMany(mappedBy = "categories")
    @JsonBackReference
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Mixture> mixtures;

    @ManyToMany
    @JsonManagedReference
    @JoinTable(
            name = "category_tags",
            joinColumns = @JoinColumn(name = "category_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Tag> tags;
}
