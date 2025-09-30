// src/main/java/com/dvoracek/cartservice/domain/model/Cart.java
package com.dvoracek.cartservice.domain.model.cart;

import com.dvoracek.cartservice.domain.model.discount.Discount;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@EqualsAndHashCode()
@Entity
@Data
@NoArgsConstructor
@Table(indexes = {
        @Index(name = "ix_cart_username", columnList = "username", unique = true),
        @Index(name = "ix_cart_guest", columnList = "guestId", unique = true)
})
public class Cart {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;
    private String guestId;

    @OneToMany(mappedBy = "cart", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<CartItem> items = new ArrayList<>();


    @Column(name = "total_price", precision = 10, scale = 2)
    private Long totalPrice = 0L;

    @Column(name = "discount_amount", precision = 10, scale = 2)
    private Long discountAmount = 0L;

    private String discountCode;

    @ManyToOne
    @JoinColumn(name = "discount_id")
    private Discount discount;
}
