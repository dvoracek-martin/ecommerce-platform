package com.dvoracekmartin.catalogservice.domain.service;

import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PendingRequestsManager {

    private final ConcurrentHashMap<Long, CompletableFuture<Integer>> pendingRequests = new ConcurrentHashMap<>();

    public void addPendingRequest(Long productId, CompletableFuture<Integer> future) {
        pendingRequests.put(productId, future);
    }

    public CompletableFuture<Integer> removePendingRequest(Long productId) {
        return pendingRequests.remove(productId);
    }

    public CompletableFuture<Integer> getPendingRequest(Long productId) {
        return pendingRequests.get(productId);
    }
}
