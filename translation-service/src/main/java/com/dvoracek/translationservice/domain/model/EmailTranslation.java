package com.dvoracek.translationservice.domain.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "product_translation",
        uniqueConstraints = @UniqueConstraint(columnNames = {"entity_id", "locale"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailTranslation {

    @Id
    private Long entityId;

    @Column(name = "locale", nullable = false, length = 2)
    private String locale;

    @Column(name = "value", nullable = false, columnDefinition = "TEXT")
    private String value;

}
