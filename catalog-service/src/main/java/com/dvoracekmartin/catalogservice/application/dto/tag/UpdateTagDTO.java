package com.dvoracekmartin.catalogservice.application.dto.tag;

import java.util.List;

public record UpdateTagDTO(
        Long id,
        String name,
        List<Long> products,
        List<Long> categories,
        List<Long> mixtures
) {
}
