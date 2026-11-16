package com.carbonwise.backend.repository;

import com.carbonwise.backend.entity.RecycleRequest;
import com.carbonwise.backend.entity.RecycleStatus;
import com.carbonwise.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RecycleRequestRepository extends JpaRepository<RecycleRequest, UUID> {
    List<RecycleRequest> findAllByOrderByCreatedAtDesc();
    List<RecycleRequest> findByUser(User user);
    List<RecycleRequest> findByStatus(RecycleStatus status);
}
