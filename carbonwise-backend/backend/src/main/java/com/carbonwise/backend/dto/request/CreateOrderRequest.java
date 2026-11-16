package com.carbonwise.backend.dto.request;

import com.carbonwise.backend.entity.DeliveryMethod;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderRequest {
    private UUID productId;
    private String deliveryType;
    private DeliveryMethod deliveryMethod;
    private Double amountPaid;
    private String paymentId;

    public DeliveryMethod getResolvedDeliveryMethod() {
        if (deliveryMethod != null) return deliveryMethod;
        if (deliveryType != null) {
            try {
                return DeliveryMethod.valueOf(deliveryType.trim());
            } catch (Exception ignored) {}
        }
        return DeliveryMethod.LOCAL_QR;
    }
}
