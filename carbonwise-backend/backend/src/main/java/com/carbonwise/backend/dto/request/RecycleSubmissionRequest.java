package com.carbonwise.backend.dto.request;

import com.carbonwise.backend.entity.Category;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecycleSubmissionRequest {
    private String productName;
    private Double weightKg;
    private Category deviceType;
}
