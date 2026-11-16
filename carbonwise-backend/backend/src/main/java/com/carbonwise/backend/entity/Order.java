package com.carbonwise.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "orders")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Product product;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "buyer_id", nullable = false)
    @JsonIgnoreProperties({"password", "authorities", "hibernateLazyInitializer", "handler"})
    private User buyer;

    private String paymentId;

    private Double amountPaid;

    @Enumerated(EnumType.STRING)
    private EscrowStatus escrowStatus;

    @Enumerated(EnumType.STRING)
    private DeliveryMethod deliveryMethod;

    private String qrHash;
    private String awbNumber;

    @CreationTimestamp
    private LocalDateTime createdAt;

    // Frontend property aliases
    public String getStatus() {
        return escrowStatus != null ? escrowStatus.name() : null;
    }

    public void setStatus(String status) {
        if (status != null) {
            try {
                this.escrowStatus = EscrowStatus.valueOf(status);
            } catch (IllegalArgumentException ignored) {}
        }
    }

    public String getDeliveryType() {
        return deliveryMethod != null ? deliveryMethod.name() : null;
    }

    public void setDeliveryType(String type) {
        if (type != null) {
            try {
                this.deliveryMethod = DeliveryMethod.valueOf(type);
            } catch (IllegalArgumentException ignored) {}
        }
    }
}
