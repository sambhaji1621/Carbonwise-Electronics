package com.carbonwise.backend.repository;

import com.carbonwise.backend.entity.Order;
import com.carbonwise.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {
    List<Order> findByBuyerOrderByCreatedAtDesc(User buyer);
    List<Order> findByBuyer(User buyer);

    @Query("SELECT o FROM Order o WHERE o.product.seller = :seller ORDER BY o.createdAt DESC")
    List<Order> findByProductSellerOrderByCreatedAtDesc(@Param("seller") User seller);
}
