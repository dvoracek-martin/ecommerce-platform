package com.dvoracekmartin.catalogservice.config.security;

/**
 * Centralized list of all API endpoint paths.
 * Grouped by controller and separated for public GET endpoints.
 */
public final class ApiEndpoints {

    private ApiEndpoints() {
        // Utility class, no instances allowed
    }

    // ============================================================
    // CatalogControllerV1 (public catalog API)
    // ============================================================
    public static final String ACTIVE_CATEGORIES = "/api/catalog/v1/active-categories";
    public static final String ACTIVE_CATEGORIES_FOR_MIXING = "/api/catalog/v1/active-categories-for-mixing";
    public static final String ACTIVE_MIXTURES_FOR_DISPLAY = "/api/catalog/v1/active-mixtures-for-display-in-products";
    public static final String ACTIVE_PRODUCTS_BY_CATEGORY = "/api/catalog/v1/active-products-by-category-id/{categoryId}";
    public static final String ACTIVE_PRODUCTS_FOR_DISPLAY = "/api/catalog/v1/active-products-for-display-in-products";
    public static final String ACTIVE_PRODUCTS_FOR_MIXING = "/api/catalog/v1/active-products-for-mixing-by-category-id/{categoryId}";
    public static final String ALL_CATEGORIES = "/api/catalog/v1/all-categories";
    public static final String ALL_MIXTURES = "/api/catalog/v1/all-mixtures";
    public static final String ALL_PRODUCTS = "/api/catalog/v1/all-products";
    public static final String ALL_PRODUCTS_BY_CATEGORY = "/api/catalog/v1/all-products-by-category-id/{categoryId}";
    public static final String ALL_TAGS = "/api/catalog/v1/all-tags";
    public static final String CATEGORY_BY_ID = "/api/catalog/v1/categories/{id}";
    public static final String MEDIA = "/api/catalog/v1/media";
    public static final String MEDIA_LIST = "/api/catalog/v1/media/list";
    public static final String MEDIA_LIST_NAMES = "/api/catalog/v1/media/list-names";
    public static final String MIXTURE_BY_ID = "/api/catalog/v1/mixtures/{id}";
    public static final String PRODUCT_BY_ID = "/api/catalog/v1/products/{id}";
    public static final String SEARCH = "/api/catalog/v1/search";
    public static final String TAG_BY_ID = "/api/catalog/v1/tags/{id}";

    // ============================================================
    // CatalogAdminControllerV1 (admin panel API, GET only)
    // ============================================================
    public static final String ADMIN_CATEGORIES = "/api/catalog/v1/admin/categories";
    public static final String ADMIN_CATEGORY_BY_ID = "/api/catalog/v1/admin/categories/{id}";
    public static final String ADMIN_INDEX_ALL = "/api/catalog/v1/admin/index-all";
    public static final String ADMIN_MIXTURES = "/api/catalog/v1/admin/mixtures";
    public static final String ADMIN_MIXTURE_BY_ID = "/api/catalog/v1/admin/mixtures/{id}";
    public static final String ADMIN_PRODUCTS = "/api/catalog/v1/admin/products";
    public static final String ADMIN_PRODUCT_BY_ID = "/api/catalog/v1/admin/products/{id}";
    public static final String ADMIN_PRODUCT_STOCK = "/api/catalog/v1/admin/products/{id}/stock";
    public static final String ADMIN_SEARCH = "/api/catalog/v1/admin/search";
    public static final String ADMIN_TAGS = "/api/catalog/v1/admin/tags";
    public static final String ADMIN_TAG_BY_ID = "/api/catalog/v1/admin/tags/{id}";

    /**
     * List of all publicly accessible GET endpoints.
     */
    public static final String[] PUBLIC_GET_ENDPOINTS = {
            // CatalogControllerV1
            ACTIVE_CATEGORIES,
            ACTIVE_CATEGORIES_FOR_MIXING,
            ACTIVE_MIXTURES_FOR_DISPLAY,
            ACTIVE_PRODUCTS_BY_CATEGORY,
            ACTIVE_PRODUCTS_FOR_DISPLAY,
            ACTIVE_PRODUCTS_FOR_MIXING,
            ALL_CATEGORIES,
            ALL_MIXTURES,
            ALL_PRODUCTS,
            ALL_PRODUCTS_BY_CATEGORY,
            ALL_TAGS,
            CATEGORY_BY_ID,
            MEDIA,
            MEDIA_LIST,
            MEDIA_LIST_NAMES,
            MIXTURE_BY_ID,
            PRODUCT_BY_ID,
            SEARCH,
            TAG_BY_ID,

            // CatalogAdminControllerV1
            ADMIN_CATEGORIES,
            ADMIN_CATEGORY_BY_ID,
            ADMIN_INDEX_ALL,
            ADMIN_MIXTURES,
            ADMIN_MIXTURE_BY_ID,
            ADMIN_PRODUCTS,
            ADMIN_PRODUCT_BY_ID,
            ADMIN_PRODUCT_STOCK,
            ADMIN_SEARCH,
            ADMIN_TAGS,
            ADMIN_TAG_BY_ID
    };
}
