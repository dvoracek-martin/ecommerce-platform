package com.dvoracekmartin.orderservice.domain.service;

import com.dvoracekmartin.common.dto.cart.CartItemDTO;
import com.dvoracekmartin.common.dto.cart.CartItemType;
import com.dvoracekmartin.common.dto.customer.ResponseCustomerDTO;
import com.dvoracekmartin.orderservice.application.dto.OrderRequest;
import com.dvoracekmartin.orderservice.application.dto.OrderResponse;
import com.dvoracekmartin.orderservice.application.service.customer.CustomerClient;
import com.dvoracekmartin.orderservice.application.service.media.MediaRetriever;
import com.dvoracekmartin.orderservice.application.service.media.MediaUploader;
import com.dvoracekmartin.orderservice.application.service.pdf.PdfGenerationService;
import com.dvoracekmartin.orderservice.application.utils.OrderStatus;
import com.dvoracekmartin.orderservice.application.utils.PdfDataWrapper;
import com.dvoracekmartin.orderservice.domain.model.Order;
import com.dvoracekmartin.orderservice.domain.model.OrderItem;
import com.dvoracekmartin.orderservice.domain.repository.OrderRepository;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class OrderServiceImpl implements OrderService {

    private static final String DELIMITER = "/";
    private static final String PDF_EXTENSION = ".pdf";
    private static final String INVOICES_BUCKET_NAME = "invoices";
    public static final String CONTENT_TYPE = "application/pdf";

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
        List<OrderItem> orderItems = orderRequest.getItems().stream().map(cartItem -> {
            OrderItem orderItem = new OrderItem();
            orderItem.setItemId(cartItem.getItemId());
            orderItem.setItemType(cartItem.getCartItemType().name());
            orderItem.setQuantity(cartItem.getQuantity());
            orderItem.setOrder(order);
            return orderItem;
        }).collect(Collectors.toList());

        order.setItems(orderItems);
        order.setShippingCost(orderRequest.getShippingCost());
        order.setCartTotal(orderRequest.getCartTotal());
        order.setFinalTotal(orderRequest.getFinalTotal());
        order.setShippingMethod(orderRequest.getShippingMethod());
        order.setPaymentMethod(orderRequest.getPaymentMethod());
        order.setStatus(OrderStatus.CREATED);

        Order savedOrder = orderRepository.save(order);
        byte[] invoicePdf = pdfGenerationService.generateInvoice(savedOrder);
        String base64Invoice = Base64.getEncoder().encodeToString(invoicePdf);

        // Create the correct path structure
        String folderPath = savedOrder.getCustomerId();
        ResponseCustomerDTO responseCustomerDTO = customerClient.getCustomerById(savedOrder.getCustomerId());
        String invoiceName = responseCustomerDTO.lastName() + responseCustomerDTO.firstName() + formatLocalDateTimeyyyyMMdd(savedOrder.getOrderDate());
        mediaUploader.uploadBase64(base64Invoice, folderPath, invoiceName, CONTENT_TYPE, INVOICES_BUCKET_NAME, folderPath);

        return convertToResponse(savedOrder);
    }

    @Override
    public OrderResponse getOrderById(String username, Long orderId) {
        Order order = orderRepository.findById(orderId).orElseThrow(() -> new RuntimeException("Order not found"));
        OrderResponse orderResponse = convertToResponse(order);
        return orderResponse;
    }

    @Override
    public List<OrderResponse> getOrdersByCustomerId(String username, String customerId) {
        if (!customerId.equals(username)) {
            throw new IllegalArgumentException("id doesn't match with the current user");
        }
        // return sorted by date in descending order
        return orderRepository.findByCustomerId(customerId).stream().sorted(Comparator.comparing(Order::getOrderDate).reversed()).map(this::convertToResponse).collect(Collectors.toList());
    }

    @Transactional
    @Override
    public Order createOrderWithInvoice(Order order) {
        Order savedOrder = orderRepository.save(order);

        byte[] invoicePdf = pdfGenerationService.generateInvoice(savedOrder);
        String base64Invoice = Base64.getEncoder().encodeToString(invoicePdf);

        ResponseCustomerDTO responseCustomerDTO = customerClient.getCustomerById(savedOrder.getCustomerId());
        String invoiceName = responseCustomerDTO.lastName() + responseCustomerDTO.firstName() + formatLocalDateTimeyyyyMMdd(savedOrder.getOrderDate());

        String folderPath = INVOICES_BUCKET_NAME + DELIMITER + savedOrder.getCustomerId();

        mediaUploader.uploadBase64(base64Invoice, folderPath, invoiceName, CONTENT_TYPE, INVOICES_BUCKET_NAME, folderPath);

        return orderRepository.save(savedOrder);
    }

    @Override
    public PdfDataWrapper getInvoiceByOrderId(String username, String customerId, Long orderId) {
        if (!customerId.equals(username)) {
            throw new IllegalArgumentException("id doesn't match with the current user");
        }
        Order order = orderRepository.findByIdAndCustomerId(orderId, customerId).orElseThrow(() -> new IllegalArgumentException("Order not found for customer"));

        // Retrieve the PDF from MediaRetriever

        ResponseCustomerDTO responseCustomerDTO = customerClient.getCustomerById(customerId);
        String invoiceName = responseCustomerDTO.lastName() + responseCustomerDTO.firstName() + formatLocalDateTimeyyyyMMdd(order.getOrderDate());

        byte[] invoiceData = mediaRetriever.retrieveMedia(username + DELIMITER + invoiceName + PDF_EXTENSION, "invoices");

        if (invoiceData == null) {
            throw new RuntimeException("Invoice file not found");
        }

        return new PdfDataWrapper(invoiceData, invoiceName);
    }

    private static String formatLocalDateTimeyyyyMMdd(LocalDateTime orderDate) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMdd");
        return formatter.format(orderDate);
    }

    private OrderResponse convertToResponse(Order order) {
        OrderResponse response = new OrderResponse();
        response.setId(order.getId());
        response.setCustomerId(order.getCustomerId());

        // Convert OrderItems to OrderItemResponses
        List<CartItemDTO> cartItemDTOS = order.getItems().stream().map(item -> new CartItemDTO(item.getItemId(), CartItemType.valueOf(item.getItemType()), item.getQuantity())).collect(Collectors.toList());
        response.setItems(cartItemDTOS);
        response.setShippingCost(order.getShippingCost());
        response.setCartTotal(order.getCartTotal());
        response.setFinalTotal(order.getFinalTotal());
        response.setStatus(order.getStatus());
        response.setShippingMethod(order.getShippingMethod());
        response.setPaymentMethod(order.getPaymentMethod());
        response.setOrderDate(order.getOrderDate());
        response.setTrackingNumber(order.getTrackingNumber());
        return response;
    }
}
