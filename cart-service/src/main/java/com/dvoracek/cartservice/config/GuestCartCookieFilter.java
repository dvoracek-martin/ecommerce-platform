// src/main/java/com/dvoracek/cartservice/config/GuestCartCookieFilter.java
package com.dvoracek.cartservice.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Arrays;
import java.util.UUID;

@Component
public class GuestCartCookieFilter extends OncePerRequestFilter {

    private static final String CART_PATH_PATTERN_V1 = "/api/cart/v1/**";
    private static final String GUEST_COOKIE = "gcid";
    private static final int MAX_AGE_SECONDS = (int) Duration.ofDays(30).toSeconds();
    private final AntPathMatcher matcher = new AntPathMatcher();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !matcher.match(CART_PATH_PATTERN_V1, request.getRequestURI());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {

        boolean authenticated = SecurityContextHolder.getContext().getAuthentication() != null
                && SecurityContextHolder.getContext().getAuthentication().isAuthenticated();

        // not logged in and doesn't have gcid → create
        if (!authenticated) {
            String gcid = null;
            if (req.getCookies() != null) {
                gcid = Arrays.stream(req.getCookies())
                        .filter(c -> GUEST_COOKIE.equals(c.getName()))
                        .map(Cookie::getValue)
                        .findFirst()
                        .orElse(null);
            }
            if (gcid == null || gcid.isBlank()) {
                String newId = UUID.randomUUID().toString();
                Cookie cookie = new Cookie(GUEST_COOKIE, newId);
                cookie.setHttpOnly(true);
                cookie.setPath("/");
                cookie.setMaxAge(MAX_AGE_SECONDS);
                res.addCookie(cookie);
                res.addHeader(HttpHeaders.SET_COOKIE,
                        GUEST_COOKIE + "=" + newId + "; Max-Age=" + MAX_AGE_SECONDS +
                                "; Path=/; HttpOnly; SameSite=Lax");
            }
        }

        chain.doFilter(req, res);
    }
}
