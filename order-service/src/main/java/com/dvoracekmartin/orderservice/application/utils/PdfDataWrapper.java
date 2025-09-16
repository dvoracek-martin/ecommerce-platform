package com.dvoracekmartin.orderservice.application.utils;

public record PdfDataWrapper(
        byte[] data,
        String filename
) {
}
