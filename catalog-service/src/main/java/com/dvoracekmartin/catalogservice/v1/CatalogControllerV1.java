package com.dvoracekmartin.catalogservice.v1;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/catalog/v1")
@Validated
public class CatalogControllerV1 {

    private static final Logger LOG = LoggerFactory.getLogger(CatalogControllerV1.class);
}
