package com.dvoracek.translationservice.domain.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
        name = "category_translation"
)
@NoArgsConstructor
@Getter
@Setter
public class CategoryTranslation extends BaseTranslation {
    public CategoryTranslation(Long entityId, String locale, String name, String description, String url) {
        this.setEntityId(entityId);
        this.setLocale(locale);
        this.setName(name);
        this.setDescription(description);
        this.setUrl(url);
    }
}
