package com.dvoracek.translationservice.domain.model;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
@Entity
@Table(
        name = "product_translation",
        uniqueConstraints = @UniqueConstraint(columnNames = {"entity_id", "locale"})
)
@Getter
@Setter
@NoArgsConstructor
public class ProductTranslation extends BaseTranslation {

    public ProductTranslation(Long entityId, String locale, String name, String description, String url) {
        this.setEntityId(entityId);
        this.setLocale(locale);
        this.setName(name);
        this.setDescription(description);
        this.setUrl(url);
    }
}
