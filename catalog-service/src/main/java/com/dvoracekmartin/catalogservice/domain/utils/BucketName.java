package com.dvoracekmartin.catalogservice.domain.utils;

import lombok.Getter;

@Getter
public enum BucketName {
    CATEGORIES("categories"),
    PRODUCTS("products"),
    MIXTURES("mixtures"),
    TAGS("tags");

    private final String name;

    BucketName(String name) {
        this.name = name;
    }
}
