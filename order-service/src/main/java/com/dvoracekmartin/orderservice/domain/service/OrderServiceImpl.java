package com.dvoracekmartin.orderservice.domain.service;

import com.dvoracekmartin.orderservice.application.dto.OrderRequest;
import com.dvoracekmartin.orderservice.application.dto.OrderResponse;
import com.dvoracekmartin.orderservice.application.service.media.MediaRetriever;
import com.dvoracekmartin.orderservice.application.service.media.MediaUploader;
import com.dvoracekmartin.orderservice.application.service.pdf.PdfGenerationService;
import com.dvoracekmartin.orderservice.application.utils.OrderMapper;
import com.dvoracekmartin.orderservice.application.utils.OrderStatus;
import com.dvoracekmartin.orderservice.application.utils.PdfDataWrapper;
import com.dvoracekmartin.orderservice.domain.model.Order;
import com.dvoracekmartin.orderservice.domain.model.OrderItem;
import com.dvoracekmartin.orderservice.domain.repository.OrderRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Base64;
import java.util.Comparator;
import java.util.List;

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
    private final OrderCounterService orderCounterService;
    private final OrderMapper orderMapper;

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
        }).toList();

        order.setItems(orderItems);
        order.setShippingCost(orderRequest.getShippingCost());
        order.setCartTotal(orderRequest.getCartTotal());
        order.setFinalTotal(orderRequest.getFinalTotal());
        order.setShippingMethod(orderRequest.getShippingMethod());
        order.setPaymentMethod(orderRequest.getPaymentMethod());
        order.setStatus(OrderStatus.CREATED);
        order.setOrderYearOrderCounter(orderCounterService.getNextOrderNumberCounter());

        Order savedOrder = orderRepository.save(order);
        byte[] invoicePdf = pdfGenerationService.generateInvoice(savedOrder);
        String base64Invoice = Base64.getEncoder().encodeToString(invoicePdf);

        // Create the correct path structure
        String folderPath = savedOrder.getCustomerId();
        mediaUploader.uploadBase64(base64Invoice, folderPath, orderCounterService.generateInvoiceName(), CONTENT_TYPE, INVOICES_BUCKET_NAME, folderPath);
        return orderMapper.mapOrderToOrderResponse(savedOrder);
    }

    @Override
    public OrderResponse getOrderById(String username, Long orderId) {
        Order order = orderRepository.findById(orderId).orElseThrow(() -> new RuntimeException("Order not found"));
        return orderMapper.mapOrderToOrderResponse(order);
    }

    @Override
    public List<OrderResponse> getOrdersByCustomerId(String username, String customerId) {
        if (!customerId.equals(username)) {
            throw new IllegalArgumentException("id doesn't match with the current user");
        }
        return orderRepository.findByCustomerId(customerId).stream().sorted(Comparator.comparing(Order::getOrderDate).reversed()).map(orderMapper::mapOrderToOrderResponse).toList();
    }

    @Override
    public PdfDataWrapper getInvoiceByOrderId(String username, String customerId, Long orderId) {
        if (!customerId.equals(username)) {
            throw new IllegalArgumentException("id doesn't match with the current user");
        }
        Order order = orderRepository.findByIdAndCustomerId(orderId, customerId).orElseThrow(() -> new IllegalArgumentException("Order not found for customer"));

        // Retrieve the PDF from MediaRetriever
        String invoiceName = orderCounterService.generateInvoiceName(order.getOrderDate().getYear(), order.getOrderYearOrderCounter());
        byte[] invoiceData = mediaRetriever.retrieveMedia(username + DELIMITER + invoiceName + PDF_EXTENSION, "invoices");

        if (invoiceData == null) {
            throw new RuntimeException("Invoice file not found");
        }

        return new PdfDataWrapper(invoiceData, invoiceName);
    }

    @Override
    public List<OrderResponse> findAll() {
        List<Order> orders = orderRepository.findAll();
        return orders.stream().sorted(Comparator.comparing(Order::getOrderDate).reversed()).map(orderMapper::mapOrderToOrderResponse).toList();
    }
}
