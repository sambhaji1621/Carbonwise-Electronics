package com.carbonwise.backend.repository;

import com.carbonwise.backend.entity.ListingStatus;
import com.carbonwise.backend.entity.Product;
import com.carbonwise.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID> {
    List<Product> findByStatus(ListingStatus status);
    List<Product> findByStatusOrderByCreatedAtDesc(ListingStatus status);
    List<Product> findBySeller(User seller);
    List<Product> findBySellerId(UUID sellerId);
    List<Product> findByStatusOrderByScamProbability1To10Desc(ListingStatus status);

    @Query("SELECT p FROM Product p WHERE p.status = :status AND (p.seller IS NULL OR p.seller.id != :sellerId) ORDER BY p.createdAt DESC")
    List<Product> findByStatusAndSellerIdNot(@Param("status") ListingStatus status, @Param("sellerId") UUID sellerId);
}
