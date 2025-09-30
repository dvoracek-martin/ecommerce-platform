package com.dvoracek.translationservice.domain.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
        name = "mixture_translation"
)
@NoArgsConstructor
@Getter
@Setter
public class MixtureTranslation extends BaseTranslation {
    public MixtureTranslation(Long entityId, String locale, String name, String description, String url) {
        this.setEntityId(entityId);
        this.setLocale(locale);
        this.setName(name);
        this.setDescription(description);
        this.setUrl(url);
    }
}
