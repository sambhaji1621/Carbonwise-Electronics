package com.carbonwise.backend.dto.request;

import com.carbonwise.backend.entity.Category;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiAnalysisRequest {
    private UUID productId;
    private String title;
    private Double price;
    private Category category;
    private String userDescription;
    private byte[] imageBytes;
    private String mimeType;

    public AiAnalysisRequest(UUID productId, byte[] imageBytes, String mimeType, String userDescription) {
        this.productId = productId;
        this.imageBytes = imageBytes;
        this.mimeType = mimeType;
        this.userDescription = userDescription;
    }

    public AiAnalysisRequest(byte[] imageBytes, String mimeType, String userDescription) {
        this.imageBytes = imageBytes;
        this.mimeType = mimeType;
        this.userDescription = userDescription;
    }
}
