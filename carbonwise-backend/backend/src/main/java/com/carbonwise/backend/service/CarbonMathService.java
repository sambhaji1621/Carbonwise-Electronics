package com.carbonwise.backend.service;

import com.carbonwise.backend.ai.GeminiClientService;
import com.carbonwise.backend.dto.request.AiAnalysisRequest;
import com.carbonwise.backend.dto.response.AiAnalysisResponse;
import com.carbonwise.backend.entity.Category;
import com.carbonwise.backend.entity.DeliveryMethod;
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
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CarbonMathService {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final GeminiClientService geminiClientService;

    private static final Map<Category, Double> BASELINE_KG = Map.of(
            Category.SMARTPHONE, 55.0,
            Category.LAPTOP, 300.0,
            Category.TABLET, 100.0,
            Category.SMARTWATCH, 30.0,
            Category.AUDIO, 20.0,
            Category.PC_COMPONENT, 80.0,
            Category.UNSUPPORTED, 25.0
    );

    @Transactional
    public Product evaluateProductDirectly(Product product, AiAnalysisRequest request) {
        log.info("Starting AI evaluation for Product ID: {}", product.getId());
        try {
            AiAnalysisResponse response = geminiClientService.analyzeListing(request);

            if (response.getHardwareSpecs() != null && !response.getHardwareSpecs().isBlank()) {
                product.setHardwareSpecs(response.getHardwareSpecs());
                if (product.getTitle() == null || product.getTitle().isBlank() || product.getTitle().startsWith("Listing #")) {
                    product.setTitle(response.getHardwareSpecs());
                }
            }
            if (response.getCategory() != null) {
                product.setCategory(response.getCategory());
            }
            if (response.getCosmeticDefects() != null) {
                product.setCosmeticDefects(response.getCosmeticDefects());
            }
            if (response.getFunctionalStatus() != null) {
                product.setFunctionalStatus(response.getFunctionalStatus());
            }
            if (response.getEstimatedPriceInr() != null) {
                product.setEstimatedPriceInr(response.getEstimatedPriceInr());
                if (product.getPrice() == null || product.getPrice() <= 0) {
                    product.setPrice(response.getEstimatedPriceInr());
                }
            }
            product.setIsStockPhotoOrFake(response.getIsStockPhotoOrFake());
            product.setScamProbability1To10(response.getScamProbability1To10());
            product.setAiFraudReasoning(response.getFraudReasoningLog());

            // High risk only if scam score >= 7 or fake or unsupported category
            boolean isHighRisk = Boolean.TRUE.equals(response.getIsStockPhotoOrFake())
                    || (response.getScamProbability1To10() != null && response.getScamProbability1To10() >= 7)
                    || response.getCategory() == Category.UNSUPPORTED;

            if (isHighRisk) {
                product.setStatus(ListingStatus.PENDING_ADMIN_REVIEW);
                log.warn("Product ID {} flagged for human Admin Review. Score: {}, Reasoning: {}",
                        product.getId(), response.getScamProbability1To10(), response.getFraudReasoningLog());
            } else {
                product.setStatus(ListingStatus.ACTIVE);
                log.info("Product ID {} verified clean by AI and set to ACTIVE.", product.getId());
            }

            return productRepository.save(product);
        } catch (Exception e) {
            log.error("Error during AI evaluation for Product ID: {}", product.getId(), e);
            product.setStatus(ListingStatus.PENDING_ADMIN_REVIEW);
            product.setAiFraudReasoning("AI verification anomaly: Listing routed for mandatory human Admin Review.");
            return productRepository.save(product);
        }
    }

    @Async
    public void evaluateProductAsync(AiAnalysisRequest request) {
        productRepository.findById(request.getProductId()).ifPresent(product -> {
            evaluateProductDirectly(product, request);
        });
    }

    @Transactional
    public void awardMarketplaceTransaction(User buyer, User seller, Category category, DeliveryMethod deliveryMethod, double distanceKm) {
        double embodiedCarbon = BASELINE_KG.getOrDefault(category != null ? category : Category.UNSUPPORTED, 25.0);
        double deliveryEmissions = (deliveryMethod == DeliveryMethod.LOCAL_QR) ? 0.0 : (distanceKm * 0.14);
        double netSavings = Math.max(5.0, embodiedCarbon - deliveryEmissions);

        BigDecimal creditsToAward = BigDecimal.valueOf(Math.round(netSavings * 10.0) / 10.0);

        if (buyer != null) {
            BigDecimal current = buyer.getCarbonCredits() != null ? buyer.getCarbonCredits() : BigDecimal.ZERO;
            buyer.setCarbonCredits(current.add(creditsToAward));
            userRepository.save(buyer);
        }

        if (seller != null) {
            BigDecimal current = seller.getCarbonCredits() != null ? seller.getCarbonCredits() : BigDecimal.ZERO;
            seller.setCarbonCredits(current.add(creditsToAward));
            userRepository.save(seller);
        }

        log.info("Awarded {} kg CO2e credits to buyer and seller", creditsToAward);
    }

    @Transactional
    public void awardRecycling(User user, Category category) {
        awardRecycling(user, category, 1.0);
    }

    @Transactional
    public void awardRecycling(User user, Category category, Double weightKg) {
        double baseCredits = BASELINE_KG.getOrDefault(category != null ? category : Category.UNSUPPORTED, 25.0) * 0.3;
        if (weightKg != null && weightKg > 0) {
            baseCredits = Math.max(baseCredits, weightKg * 15.0);
        }

        BigDecimal creditsToAward = BigDecimal.valueOf(Math.round(baseCredits * 10.0) / 10.0);

        if (user != null) {
            BigDecimal current = user.getCarbonCredits() != null ? user.getCarbonCredits() : BigDecimal.ZERO;
            user.setCarbonCredits(current.add(creditsToAward));
            userRepository.save(user);
            log.info("Awarded {} kg CO2e recycling credits to user {}", creditsToAward, user.getName());
        }
    }
}
