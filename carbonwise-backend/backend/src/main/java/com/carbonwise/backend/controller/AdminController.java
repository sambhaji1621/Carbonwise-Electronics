package com.carbonwise.backend.controller;

import com.carbonwise.backend.entity.ListingStatus;
import com.carbonwise.backend.entity.Product;
import com.carbonwise.backend.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
@PreAuthorize("hasRole('ADMIN') or hasRole('ROLE_ADMIN') or hasAuthority('ROLE_ADMIN') or hasAuthority('ADMIN')")
public class AdminController {

    private final ProductRepository productRepository;

    @GetMapping("/flagged-products")
    public ResponseEntity<List<Product>> getFlaggedProducts() {
        List<Product> flagged = productRepository.findByStatusOrderByCreatedAtDesc(ListingStatus.PENDING_ADMIN_REVIEW);
        return ResponseEntity.ok(flagged);
    }

    @PutMapping("/products/{id}/approve")
    public ResponseEntity<?> approveProduct(@PathVariable UUID id) {
        return productRepository.findById(id).map(product -> {
            product.setStatus(ListingStatus.ACTIVE);
            Product saved = productRepository.save(product);
            log.info("Admin approved Product ID: {}", id);
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/products/{id}/reject")
    public ResponseEntity<?> rejectProduct(@PathVariable UUID id) {
        return productRepository.findById(id).map(product -> {
            product.setStatus(ListingStatus.DELETED);
            Product saved = productRepository.save(product);
            log.info("Admin rejected and deleted Product ID: {}", id);
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }
}
