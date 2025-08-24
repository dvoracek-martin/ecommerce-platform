package com.dvoracek.cartservice.application.service;

import com.dvoracek.cartservice.domain.model.Cart;
import com.dvoracek.cartservice.domain.model.CartItem;

/**
 * Interface for the Cart Service.
 * Defines the contract for managing shopping cart operations,
 * including retrieval, creation, adding, removing, updating items,
 * and merging guest carts.
 */
public interface CartService {

    /**
     * Retrieves an existing cart for a given username or guest ID, or creates a new one if it doesn't exist.
     *
     * @param username The username of the authenticated user. Can be null or blank for guest users.
     * @param guestId The unique identifier for a guest user's cart. Can be null or blank for authenticated users.
     * @return The existing or newly created Cart object.
     */
    Cart getOrCreateCart(String username, String guestId);

    /**
     * Retrieves an existing cart for a given username or guest ID.
     * If no cart is found, an empty Cart object is returned.
     *
     * @param username The username of the authenticated user. Can be null or blank for guest users.
     * @param guestId The unique identifier for a guest user's cart. Can be null or blank for authenticated users.
     * @return The found Cart object, or an empty Cart if not found.
     */
    Cart getCart(String username, String guestId);

    /**
     * Adds a new item or updates the quantity of an existing item in the cart.
     *
     * @param username The username of the authenticated user.
     * @param guestId The unique identifier for a guest user's cart.
     * @param newItem The CartItem to be added or whose quantity is to be updated.
     * @return The updated Cart object.
     */
    Cart addItem(String username, String guestId, CartItem newItem);

    /**
     * Removes an item from the cart based on its product ID.
     *
     * @param username The username of the authenticated user.
     * @param guestId The unique identifier for a guest user's cart.
     * @param productId The ID of the product to be removed from the cart.
     * @return The updated Cart object.
     */
    Cart removeItem(String username, String guestId, Long productId);

    /**
     * Updates the quantity of a specific item in the cart.
     *
     * @param username The username of the authenticated user.
     * @param guestId The unique identifier for a guest user's cart.
     * @param productId The ID of the product whose quantity is to be updated.
     * @param quantity The new quantity for the specified product.
     * @return The updated Cart object.
     */
    Cart updateItemQuantity(String username, String guestId, Long productId, int quantity);

    /**
     * Merges the contents of a guest user's cart into an authenticated user's cart.
     * If the guest cart contains items already present in the user's cart, their quantities are combined.
     * The guest cart is typically deleted after a successful merge.
     *
     * @param username The username of the authenticated user.
     * @param guestId The unique identifier for the guest user whose cart is to be merged.
     * @return The merged Cart object of the authenticated user.
     */
    Cart mergeGuestIntoUser(String username, String guestId);
}
