package com.dvoracekmartin.orderservice.domain.service;

public interface OrderCounterService {
    String generateInvoiceName();

    String generateInvoiceName(int year, int orderNumberCounter);

    int getNextOrderNumberCounter();

    int getOrderNumberCounter();
}
