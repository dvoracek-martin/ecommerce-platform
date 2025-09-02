package com.dvoracek.cartservice.domain.repository;

import com.dvoracek.cartservice.domain.model.cart.Cart;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CartRepository extends JpaRepository<Cart, Long> {
    Optional<Cart> findByUsername(String username);

    Optional<Cart> findByGuestId(String guestId);
}
