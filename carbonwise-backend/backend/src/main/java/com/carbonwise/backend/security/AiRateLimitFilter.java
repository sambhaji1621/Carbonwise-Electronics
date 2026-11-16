package com.carbonwise.backend.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class AiRateLimitFilter extends OncePerRequestFilter {

    private final Map<String, Bucket> cache = new ConcurrentHashMap<>();

    private Bucket createNewBucket() {
        // 20 requests allowed per hour to prevent accidental locks during normal browsing/testing
        Refill refill = Refill.intervally(20, Duration.ofHours(1));
        Bandwidth limit = Bandwidth.classic(20, refill);
        return Bucket.builder().addLimit(limit).build();
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        // Pass CORS preflight OPTIONS requests immediately without consuming tokens
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        // Apply rate limiting to the AI product endpoint
        if (request.getRequestURI().startsWith("/api/products/add")) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String userKey = (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName()))
                    ? auth.getName() : request.getRemoteAddr();

            Bucket bucket = cache.computeIfAbsent(userKey != null ? userKey : "client", k -> createNewBucket());

            if (!bucket.tryConsume(1)) {
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType("application/json");
                response.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
                response.setHeader("Access-Control-Allow-Credentials", "true");
                response.getWriter().write("{\"message\":\"Layer 1 Security: AI Analysis rate limit exceeded (Max 20 per hour). Please try again later.\"}");
                return;
            }
        }
        
        filterChain.doFilter(request, response);
    }
}
