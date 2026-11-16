package com.carbonwise.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "products")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String title;
    private Double price;
    
    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private Category category;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "image_urls", columnDefinition = "TEXT")
    private String imageUrls;

    @Column(name = "video_url", length = 500)
    private String videoUrl;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private ListingStatus status;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "seller_id")
    @JsonIgnoreProperties({"password", "authorities", "hibernateLazyInitializer", "handler"})
    private User seller;

    // AI Fields
    private String hardwareSpecs;
    private String cosmeticDefects;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "functional_status", length = 50)
    private FunctionalStatus functionalStatus;
    
    private Double estimatedPriceInr;
    private Boolean isStockPhotoOrFake;
    private Integer scamProbability1To10;
    
    @Column(columnDefinition = "TEXT")
    private String aiFraudReasoning;

    private LocalDateTime createdAt;

    // Compatibility and UI convenience aliases
    public Integer getScamScore() {
        return scamProbability1To10;
    }

    public void setScamScore(Integer scamScore) {
        this.scamProbability1To10 = scamScore;
    }

    public String getName() {
        return title;
    }

    public void setName(String name) {
        this.title = name;
    }

    public String getMediaUrl() {
        return imageUrl;
    }

    public void setMediaUrl(String mediaUrl) {
        this.imageUrl = mediaUrl;
    }

    public java.util.List<String> getAllImages() {
        if (imageUrls != null && !imageUrls.trim().isEmpty()) {
            return java.util.Arrays.stream(imageUrls.split(";"))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList();
        }
        if (imageUrl != null && !imageUrl.trim().isEmpty()) {
            return java.util.List.of(imageUrl);
        }
        return java.util.List.of();
    }

    public String getLocation() {
        if (seller != null && seller.getCity() != null && !seller.getCity().trim().isEmpty()) {
            if (seller.getPinCode() != null && !seller.getPinCode().trim().isEmpty()) {
                return seller.getCity() + " (" + seller.getPinCode() + ")";
            }
            return seller.getCity();
        }
        return "Kothrud, Pune";
    }
}
