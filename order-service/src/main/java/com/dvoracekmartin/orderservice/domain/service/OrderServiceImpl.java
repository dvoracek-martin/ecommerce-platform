package com.dvoracekmartin.orderservice.domain.service;

import com.dvoracekmartin.common.dto.customer.ResponseCustomerDTO;
import com.dvoracekmartin.common.dto.media.MediaDTO;
import com.dvoracekmartin.orderservice.application.dto.OrderItemResponse;
import com.dvoracekmartin.orderservice.application.dto.OrderRequest;
import com.dvoracekmartin.orderservice.application.dto.OrderResponse;
import com.dvoracekmartin.orderservice.application.service.customer.CustomerClient;
import com.dvoracekmartin.orderservice.application.service.media.MediaRetriever;
import com.dvoracekmartin.orderservice.application.service.media.MediaUploader;
import com.dvoracekmartin.orderservice.application.service.pdf.PdfGenerationService;
import com.dvoracekmartin.orderservice.application.utils.OrderStatus;
import com.dvoracekmartin.orderservice.domain.model.Order;
import com.dvoracekmartin.orderservice.domain.model.OrderItem;
import com.dvoracekmartin.orderservice.domain.repository.OrderRepository;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Base64;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class OrderServiceImpl implements OrderService {


    private final OrderRepository orderRepository;
    private final MediaRetriever mediaRetriever;
    private final MediaUploader mediaUploader;
    private final PdfGenerationService pdfGenerationService;
    private final CustomerClient customerClient;

    @Override
    public OrderResponse createOrder(String username, OrderRequest orderRequest) {
        Order order = new Order();

        // Set customer
        order.setCustomerId(orderRequest.getCustomerId());

        // Convert cart items to order items
        List<OrderItem> orderItems = orderRequest.getItems().stream()
                .map(cartItem -> {
                    OrderItem orderItem = new OrderItem();
                    orderItem.setItemId(cartItem.getItemId());
                    orderItem.setItemType(cartItem.getCartItemType().name());
                    orderItem.setQuantity(cartItem.getQuantity());
                    orderItem.setOrder(order);
                    return orderItem;
                })
                .collect(Collectors.toList());

        order.setItems(orderItems);
        order.setShippingCost(orderRequest.getShippingCost());
        order.setCartTotal(orderRequest.getCartTotal());
        order.setFinalTotal(orderRequest.getFinalTotal());
        order.setShippingMethod(orderRequest.getShippingMethod());
        order.setPaymentMethod(orderRequest.getPaymentMethod());
        order.setStatus(OrderStatus.CONFIRMED);

        Order savedOrder = orderRepository.save(order);
        byte[] invoicePdf = pdfGenerationService.generateInvoice(savedOrder);
        String base64Invoice = Base64.getEncoder().encodeToString(invoicePdf);

        // Create the correct path structure
        String folderPath = savedOrder.getCustomerId();
        String objectKey = String.valueOf(savedOrder.getId());

        String invoiceUrl = mediaUploader.uploadBase64(
                base64Invoice,
                folderPath,
                objectKey,
                "application/pdf",
                "invoices",
                folderPath
        );

        // Set the correct object key path
        savedOrder.setInvoiceObjectKey(folderPath + "/" + objectKey);
        savedOrder.setInvoiceUrl(invoiceUrl);

        return convertToResponse(savedOrder);
    }

    @Override
    public OrderResponse getOrderById(String username, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        OrderResponse orderResponse = convertToResponse(order);
        orderResponse.setInvoice(getOrderInvoice(orderId));
        return orderResponse;
    }

    @Override
    public List<OrderResponse> getOrdersByCustomerId(String username, String customerId) {
        if (!customerId.equals(username)) {
            throw new IllegalArgumentException("id doesn't match with the current user");
        }
        return orderRepository.findByCustomerId(customerId).stream()
                .sorted(Comparator.comparing(Order::getOrderDate))
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }


    @Transactional
    @Override
    public Order createOrderWithInvoice(Order order) {
        Order savedOrder = orderRepository.save(order);

        byte[] invoicePdf = pdfGenerationService.generateInvoice(savedOrder);
        String base64Invoice = Base64.getEncoder().encodeToString(invoicePdf);

        String objectKey = String.valueOf(savedOrder.getId());
        String folderPath = "invoices/" + savedOrder.getCustomerId();

        String invoiceUrl = mediaUploader.uploadBase64(
                base64Invoice,
                folderPath,
                objectKey,
                "application/pdf",
                "invoices",
                folderPath
        );

        savedOrder.setInvoiceObjectKey(folderPath + "/" + objectKey);
        savedOrder.setInvoiceUrl(invoiceUrl);

        return orderRepository.save(savedOrder);
    }

    public MediaDTO getOrderInvoice(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Not found" + orderId));

        byte[] invoiceData = mediaRetriever.retrieveMedia(
                order.getInvoiceObjectKey(),
                "invoices"
        );
        String base64Data = Base64.getEncoder().encodeToString(invoiceData);

        return new MediaDTO(base64Data, order.getInvoiceObjectKey(), "application/pdf");
    }

    private OrderResponse convertToResponse(Order order) {
        OrderResponse response = new OrderResponse();
        response.setId(order.getId());
        response.setCustomerId(order.getCustomerId());

        // Convert OrderItems to OrderItemResponses
        List<OrderItemResponse> itemResponses = order.getItems().stream()
                .map(item -> {
                    OrderItemResponse itemResponse = new OrderItemResponse();
                    itemResponse.setId(item.getId());
                    itemResponse.setItemId(item.getItemId());
                    itemResponse.setItemType(item.getItemType());
                    itemResponse.setQuantity(item.getQuantity());
                    return itemResponse;
                })
                .collect(Collectors.toList());

        response.setItems(itemResponses);
        response.setShippingCost(order.getShippingCost());
        response.setCartTotal(order.getCartTotal());
        response.setFinalTotal(order.getFinalTotal());
        response.setStatus(order.getStatus());
        response.setShippingMethod(order.getShippingMethod());
        response.setPaymentMethod(order.getPaymentMethod());
        response.setOrderDate(order.getOrderDate());
        response.setTrackingNumber(order.getTrackingNumber());
        response.setInvoiceUrl(order.getInvoiceUrl());
        return response;
    }
}
