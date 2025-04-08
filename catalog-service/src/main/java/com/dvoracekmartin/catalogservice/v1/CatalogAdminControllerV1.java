package com.dvoracekmartin.catalogservice.v1;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/catalog/v1/admin")
@PreAuthorize("hasRole('user_admin')")
@Validated
public class CatalogAdminControllerV1 {

    private static final Logger LOG = LoggerFactory.getLogger(CatalogAdminControllerV1.class);
}
