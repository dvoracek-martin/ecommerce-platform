package com.dvoracekmartin.orderservice.domain.service;

import com.dvoracekmartin.orderservice.domain.model.OrderCounter;
import com.dvoracekmartin.orderservice.domain.repository.OrderCounterRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class OrderCounterServiceImpl implements OrderCounterService {
    private final OrderCounterRepository orderCounterRepository;

    @Override
    public int getNextOrderNumberCounter() {
        int currentYear = LocalDateTime.now().getYear();

        OrderCounter counter = orderCounterRepository.findByCounterYear(currentYear)
                .orElseGet(() -> {
                    OrderCounter newCounter = new OrderCounter();
                    newCounter.setCounterYear(currentYear);
                    newCounter.setOrderNumberCounter(0);
                    return newCounter;
                });

        int nextCounter = counter.getOrderNumberCounter() + 1;
        counter.setOrderNumberCounter(nextCounter);

        orderCounterRepository.save(counter);
        return nextCounter;
    }

    @Override
    public String generateInvoiceName() {
        return String.format("%d%05d", LocalDateTime.now().getYear(), getOrderNumberCounter());
    }

    @Override
    public String generateInvoiceName(int year, int orderNumberCounter) {
        return String.format("%d%05d", year, orderNumberCounter);
    }

    @Override
    public int getOrderNumberCounter() {
        OrderCounter currentOrderCounter = orderCounterRepository.findById(LocalDateTime.now().getYear())
                .orElseThrow(() -> new EntityNotFoundException("Current year not found"));
        return currentOrderCounter.getOrderNumberCounter();
    }
}
