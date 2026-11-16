package com.carbonwise.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "recycles")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class RecycleRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"password", "authorities", "hibernateLazyInitializer", "handler"})
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "recycler_id")
    @JsonIgnoreProperties({"password", "authorities", "hibernateLazyInitializer", "handler"})
    private User recycler; // The B2B account that accepts the pickup

    private String productName;
    private Double weightKg;
    private Double carbonCredits;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    private Category deviceType;

    @Enumerated(EnumType.STRING)
    private RecycleStatus status;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
