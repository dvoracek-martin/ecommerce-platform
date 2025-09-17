package com.dvoracekmartin.orderservice.application.utils;

import com.dvoracekmartin.common.dto.cart.CartItemDTO;
import com.dvoracekmartin.common.dto.cart.CartItemType;
import com.dvoracekmartin.orderservice.application.dto.OrderResponseDTO;
import com.dvoracekmartin.orderservice.application.dto.UpdateOrderDTO;
import com.dvoracekmartin.orderservice.domain.model.Order;
import com.dvoracekmartin.orderservice.domain.model.OrderItem;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface OrderMapper {
    default OrderResponseDTO mapOrderToOrderResponseDTO(Order order) {
        return new OrderResponseDTO(order.getId(),
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

    default Order mapUpdateOrderToOrder(UpdateOrderDTO updateOrderDTO) {
        Order order = new Order();
        order.setId(updateOrderDTO.getId());
        order.setCustomerId(updateOrderDTO.getCustomerId());
        List<CartItemDTO> cartItemDTOList = updateOrderDTO.getItems();
        order.setItems(
                cartItemDTOList.stream()
                        .map(cartItemDTO -> {
                            OrderItem orderItem = new OrderItem();
                            orderItem.setItemId(cartItemDTO.getItemId());
                            orderItem.setQuantity(cartItemDTO.getQuantity());
                            orderItem.setItemType(cartItemDTO.getCartItemType().name());
                            return orderItem;
                        })
                        .toList() //
        );
        order.setOrderDate(updateOrderDTO.getOrderDate());
        order.setTrackingNumber(updateOrderDTO.getTrackingNumber());
        order.setOrderYearOrderCounter(updateOrderDTO.getOrderYearOrderCounter());
        order.setStatus(updateOrderDTO.getStatus());
        order.setShippingMethod(updateOrderDTO.getShippingMethod());
        order.setPaymentMethod(updateOrderDTO.getPaymentMethod());
        order.setShippingCost(updateOrderDTO.getShippingCost());
        order.setFinalTotal(updateOrderDTO.getFinalTotal());
        return order;
    }


}
