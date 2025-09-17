package com.dvoracekmartin.orderservice.application.utils;

import com.dvoracekmartin.common.dto.cart.CartItemDTO;
import com.dvoracekmartin.common.dto.cart.CartItemType;
import com.dvoracekmartin.orderservice.application.dto.OrderResponse;
import com.dvoracekmartin.orderservice.domain.model.Order;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface OrderMapper {
    default OrderResponse mapOrderToOrderResponse(Order order) {
        return new OrderResponse(order.getId(),
                order.getCustomerId(),
                order.getItems().stream().map(item -> new CartItemDTO(item.getItemId(), CartItemType.valueOf(item.getItemType()), item.getQuantity())).toList(),
                order.getShippingCost(),
                order.getCartTotal(),
                order.getFinalTotal(),
                order.getStatus(),
                order.getShippingMethod(),
                order.getPaymentMethod(),
                order.getOrderDate(),
                order.getTrackingNumber(),
                order.getOrderYearOrderCounter());
    }

    Order mapOrderToOrderResponse(OrderResponse orderResponse);
}
