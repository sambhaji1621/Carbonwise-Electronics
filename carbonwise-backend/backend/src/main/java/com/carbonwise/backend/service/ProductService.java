package com.carbonwise.backend.service;

import com.carbonwise.backend.ai.GeminiClientService;
import com.carbonwise.backend.dto.request.AiAnalysisRequest;
import com.carbonwise.backend.dto.response.AiAnalysisResponse;
import com.carbonwise.backend.entity.Category;
import com.carbonwise.backend.entity.FunctionalStatus;
import com.carbonwise.backend.entity.ListingStatus;
import com.carbonwise.backend.entity.Product;
import com.carbonwise.backend.entity.User;
import com.carbonwise.backend.repository.ProductRepository;
import com.carbonwise.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductService {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final GeminiClientService geminiClientService;

    // 1. FAST METHOD: Saves a placeholder and returns immediately
    public Product createPendingListing(String description, String sellerPhone) {
        User seller = userRepository.findByPhone(sellerPhone).orElseThrow();

        Product product = Product.builder()
                .seller(seller)
                .title("Analyzing Image...")
                .description(description)
                .category(Category.UNSUPPORTED)
                .price(0.0)
                .imageUrl("/api/products/images/default.jpg")
                .functionalStatus(FunctionalStatus.UNVERIFIABLE)
                .scamProbability1To10(0)
                .aiFraudReasoning("AI is currently reviewing this listing.")
                .status(ListingStatus.PENDING_AI_PROCESSING)
                .createdAt(LocalDateTime.now())
                .build();

        return productRepository.save(product);
    }

    // 2. BACKGROUND METHOD: Runs asynchronously and updates the DB when finished
    @Async
    public void processAiVerificationInBackground(UUID productId, byte[] imageBytes, String mimeType, String description) {
        log.info("Background AI process started for Product ID: " + productId);
        try {
            Product product = productRepository.findById(productId).orElseThrow();

            AiAnalysisRequest aiRequest = new AiAnalysisRequest(productId, imageBytes, mimeType, description);
            AiAnalysisResponse aiResponse = geminiClientService.analyzeListing(aiRequest);

            // Hide the product if scam score is high or unverified
            ListingStatus finalStatus = ListingStatus.ACTIVE;
            if (aiResponse.isStockPhotoOrFake()
                    || (aiResponse.getScamProbability1To10() != null && aiResponse.getScamProbability1To10() >= 5)
                    || aiResponse.getFunctionalStatus() == FunctionalStatus.UNVERIFIABLE
                    || aiResponse.getCategory() == Category.UNSUPPORTED) {
                finalStatus = ListingStatus.PENDING_ADMIN_REVIEW;
            }

            // Update the database with AI findings
            if (aiResponse.getHardwareSpecs() != null) {
                product.setTitle(aiResponse.getHardwareSpecs());
                product.setHardwareSpecs(aiResponse.getHardwareSpecs());
            }
            if (aiResponse.getCategory() != null) {
                product.setCategory(aiResponse.getCategory());
            }
            if (aiResponse.getEstimatedPriceInr() != null) {
                product.setPrice(aiResponse.getEstimatedPriceInr());
                product.setEstimatedPriceInr(aiResponse.getEstimatedPriceInr());
            }
            if (aiResponse.getFunctionalStatus() != null) {
                product.setFunctionalStatus(aiResponse.getFunctionalStatus());
            }
            product.setScamProbability1To10(aiResponse.getScamProbability1To10());
            product.setAiFraudReasoning(aiResponse.getFraudReasoningLog());
            product.setStatus(finalStatus);

            productRepository.save(product);
            log.info("Background AI process COMPLETE for Product ID: " + productId);

        } catch (Exception e) {
            log.error("Background AI failed for Product: " + productId, e);
            // SAFETY NET: If AI fails, route to human admin instead of leaving it stuck
            productRepository.findById(productId).ifPresent(product -> {
                product.setStatus(ListingStatus.PENDING_ADMIN_REVIEW);
                product.setAiFraudReasoning("System Notice: AI verification encountered an issue. Manual review required.");
                productRepository.save(product);
            });
        }
    }
}
