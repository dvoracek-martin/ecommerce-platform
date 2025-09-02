package com.dvoracekmartin.orderservice.application.service.pdf;

import com.dvoracekmartin.orderservice.domain.model.Order;

public interface PdfGenerationService {

    byte[] generateInvoice(Order order);
}
