package com.carbonwise.backend.dto.response;

import com.carbonwise.backend.entity.Category;
import com.carbonwise.backend.entity.FunctionalStatus;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class AiAnalysisResponse {
    private Category category;
    private String hardwareSpecs;
    private String cosmeticDefects;
    private FunctionalStatus functionalStatus;
    private Double estimatedPriceInr;
    
    @JsonProperty("isStockPhotoOrFake")
    private Boolean isStockPhotoOrFake;
    
    private Integer scamProbability1To10;
    private String fraudReasoningLog;

    public Boolean getIsStockPhotoOrFake() {
        return isStockPhotoOrFake != null && isStockPhotoOrFake;
    }

    public boolean isStockPhotoOrFake() {
        return Boolean.TRUE.equals(isStockPhotoOrFake);
    }
}
