package com.dvoracekmartin.catalogservice.domain.service;

import com.dvoracekmartin.common.event.translation.LocalizedField;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PendingRequestsManager {

    private final ConcurrentHashMap<Long, CompletableFuture<Integer>> pendingRequests = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, CompletableFuture<Map<String, LocalizedField>>> pendingRequests2 =
            new ConcurrentHashMap<>();

    // ---- original (pro produkty) ----
    public void addPendingRequest(Long productId, CompletableFuture<Integer> future) {
        pendingRequests.put(productId, future);
    }

    public CompletableFuture<Integer> removePendingRequest(Long productId) {
        return pendingRequests.remove(productId);
    }

    public CompletableFuture<Integer> getPendingRequest(Long productId) {
        return pendingRequests.get(productId);
    }

    public void addPendingRequest2(String correlationId, CompletableFuture<Map<String, LocalizedField>> future) {
        pendingRequests2.put(correlationId, future);
    }

    public CompletableFuture<Map<String, LocalizedField>> getPendingRequest2(String correlationId) {
        return pendingRequests2.get(correlationId);
    }

    public void removePendingRequest2(String correlationId) {
        pendingRequests2.remove(correlationId);
    }
}
