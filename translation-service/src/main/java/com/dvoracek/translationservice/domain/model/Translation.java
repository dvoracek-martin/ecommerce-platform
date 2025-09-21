package com.dvoracek.translationservice.domain.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "translation",
        uniqueConstraints = @UniqueConstraint(columnNames = {"entity_type", "entity_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Translation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "entity_type", nullable = false)
    private String entityType;

    @Column(name = "entity_id", nullable = false)
    private Long entityId;
}
