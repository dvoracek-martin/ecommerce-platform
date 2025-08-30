package com.dvoracek.cartservice.application.service;

import com.dvoracek.cartservice.application.dto.cart.CartDTO;
import com.dvoracek.cartservice.application.dto.discount.CreateDiscountDTO;
import com.dvoracek.cartservice.application.dto.discount.ResponseDiscountDTO;
import com.dvoracek.cartservice.application.utils.CartMapper;
import com.dvoracek.cartservice.domain.model.Cart;
import com.dvoracek.cartservice.domain.model.CartItem;
import com.dvoracek.cartservice.domain.model.Discount;
import com.dvoracek.cartservice.domain.model.DiscountType;
import com.dvoracek.cartservice.repository.CartRepository;
import com.dvoracek.cartservice.repository.DiscountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.security.SecureRandom;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private static final String CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int CODE_LENGTH = 6;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final CartRepository cartRepository;
    private final DiscountRepository discountRepository;
    private final CartMapper cartMapper;

    @Override
    @Transactional
    public CartDTO getCart(String username, String guestId) {
        Cart cart = getOrCreateCart(username, guestId);
        return cartMapper.toDto(cart);
    }

    @Override
    @Transactional
    public Cart getOrCreateCart(String username, String guestId) {
        if (username != null && !username.isBlank()) {
            return cartRepository.findByUsername(username)
                    .orElseGet(() -> {
                        Cart c = new Cart();
                        c.setUsername(username);
                        return cartRepository.save(c);
                    });
        }
        if (guestId != null && !guestId.isBlank()) {
            return cartRepository.findByGuestId(guestId)
                    .orElseGet(() -> {
                        Cart c = new Cart();
                        c.setGuestId(guestId);
                        return cartRepository.save(c);
                    });
        }
        // Fallback for cases with neither a username nor a guestId
        Cart c = new Cart();
        return cartRepository.save(c);
    }

    @Override
    @Transactional
    public CartDTO addItem(String username, String guestId, CartItem newItem) {
        Cart cart = getOrCreateCart(username, guestId);

        Optional<CartItem> existing = cart.getItems().stream()
                .filter(item -> item.getItemId().equals(newItem.getItemId()))
                .findFirst();

        if (existing.isPresent()) {
            existing.get().setQuantity(existing.get().getQuantity() + newItem.getQuantity());
        } else {
            newItem.setCart(cart);
            cart.getItems().add(newItem);
        }

        Cart updatedCart = cartRepository.save(cart);
        return cartMapper.toDto(updatedCart);
    }

    @Override
    @Transactional
    public CartDTO removeItem(String username, String guestId, Long getItemId) {
        Cart cart = getOrCreateCart(username, guestId);
        cart.getItems().removeIf(item -> item.getItemId().equals(getItemId));
        Cart updatedCart = cartRepository.save(cart);
        return cartMapper.toDto(updatedCart);
    }

    @Override
    @Transactional
    public CartDTO updateItemQuantity(String username, String guestId, Long getItemId, int quantity) {
        Cart cart = getOrCreateCart(username, guestId);
        cart.getItems().stream()
                .filter(item -> item.getItemId().equals(getItemId))
                .findFirst()
                .ifPresent(item -> item.setQuantity(quantity));
        Cart updatedCart = cartRepository.save(cart);
        return cartMapper.toDto(updatedCart);
    }

    @Override
    @Transactional
    public CartDTO mergeGuestIntoUser(String username, CartItem[] guestItems) {
        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("User must be logged in to merge cart.");
        }

        Cart userCart = getOrCreateCart(username, null);

        if (guestItems != null) {
            for (CartItem gi : guestItems) {
                Optional<CartItem> existing = userCart.getItems().stream()
                        .filter(ui -> ui.getItemId().equals(gi.getItemId()) &&
                                ui.getCartItemType() == gi.getCartItemType())
                        .findFirst();
                if (existing.isPresent()) {
                    existing.get().setQuantity(existing.get().getQuantity() + gi.getQuantity());
                } else {
                    CartItem copy = new CartItem();
                    copy.setItemId(gi.getItemId());
                    copy.setQuantity(gi.getQuantity());
                    copy.setCartItemType(gi.getCartItemType());
                    copy.setCart(userCart);
                    userCart.getItems().add(copy);
                }
            }
        }

        Cart updatedCart = cartRepository.save(userCart);
        return cartMapper.toDto(updatedCart);
    }

    @Override
    @Transactional
    public CartDTO applyDiscount(String username, String guestId, String discountCode) {
        Cart cart = getOrCreateCart(username, guestId);

        // Check if discount is already applied
        if (cart.getDiscount() != null && cart.getDiscount().getCode().equals(discountCode)) {
            return cartMapper.toDto(cart);
        }

        // Find active discount by code
        Optional<Discount> discountOpt = discountRepository.findByCodeAndActiveTrue(discountCode);
        if (!discountOpt.isPresent()) {
            // TODO respond to frontend if the code is invalid
            throw new IllegalArgumentException("Invalid discount code");
        }

        Discount discount = discountOpt.get();
        cart.setDiscount(discount);
        cart.setDiscountCode(discount.getCode());

        Cart updatedCart = cartRepository.save(cart);
        return cartMapper.toDto(updatedCart);
    }

    @Override
    @Transactional
    public CartDTO removeDiscount(String username, String guestId) {
        Cart cart = getOrCreateCart(username, guestId);

        cart.setDiscount(null);
        cart.setDiscountCode(null);

        Cart updatedCart = cartRepository.save(cart);
        return cartMapper.toDto(updatedCart);
    }

    @Override
    @Transactional
    public ResponseDiscountDTO createDiscount(CreateDiscountDTO createDiscountDTO) {
        String code = createDiscountDTO.getCode();

        // Generate code if not provided
        if (code == null || code.trim().isEmpty()) {
            code = generateUniqueDiscountCode();
        } else {
            // Validate provided code doesn't exist
            if (discountRepository.existsByCode(code)) {
                throw new IllegalArgumentException("Discount code already exists");
            }
        }

        // Validate discount value
        if (createDiscountDTO.getValue().compareTo(0L) <= 0) {
            throw new IllegalArgumentException("Discount value must be positive");
        }

        // For percentage discounts, validate value is reasonable
        if (createDiscountDTO.getType().equals(DiscountType.PERCENTAGE.name()) &&
                createDiscountDTO.getValue().compareTo(Long.valueOf(100)) > 0) {
            throw new IllegalArgumentException("Percentage discount cannot exceed 100%");
        }

        Discount discount = new Discount();
        discount.setCode(code.toUpperCase());
        discount.setDiscountValue(createDiscountDTO.getValue());
        discount.setType(DiscountType.valueOf(createDiscountDTO.getType()));
        discount.setActive(true);

        return cartMapper.discountToResponseDiscountDTO(discountRepository.save(discount));
    }

    private String generateUniqueDiscountCode() {
        String code;
        int attempts = 0;
        final int MAX_ATTEMPTS = 10;

        do {
            code = generateRandomCode();
            attempts++;

            if (attempts > MAX_ATTEMPTS) {
                throw new IllegalStateException("Failed to generate unique discount code after " + MAX_ATTEMPTS + " attempts");
            }
        } while (discountRepository.existsByCode(code));

        return code;
    }

    private String generateRandomCode() {
        StringBuilder sb = new StringBuilder(CODE_LENGTH);
        for (int i = 0; i < CODE_LENGTH; i++) {
            sb.append(CHARACTERS.charAt(RANDOM.nextInt(CHARACTERS.length())));
        }
        return sb.toString();
    }
}
