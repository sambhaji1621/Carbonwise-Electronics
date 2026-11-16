package com.carbonwise.backend.service;

import com.carbonwise.backend.entity.Category;
import com.carbonwise.backend.entity.RecycleRequest;
import com.carbonwise.backend.entity.RecycleStatus;
import com.carbonwise.backend.entity.User;
import com.carbonwise.backend.repository.RecycleRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RecycleService {

    private final RecycleRequestRepository recycleRequestRepository;
    private final CarbonMathService carbonMathService;

    public RecycleRequest createPickupRequest(User user, Category deviceType) {
        return createPickupRequest(user, deviceType != null ? deviceType.name() : "E-Waste Device", 1.0, deviceType, null);
    }

    public RecycleRequest createPickupRequest(User user, String productName, Double weightKg, Category deviceType) {
        return createPickupRequest(user, productName, weightKg, deviceType, null);
    }

    public RecycleRequest createPickupRequest(User user, String productName, Double weightKg, Category deviceType, String imageUrl) {
        Category resolvedType = deviceType;
        if (resolvedType == null) {
            String name = productName != null ? productName.toLowerCase() : "";
            if (name.contains("laptop") || name.contains("computer")) resolvedType = Category.LAPTOP;
            else if (name.contains("phone") || name.contains("mobile")) resolvedType = Category.SMARTPHONE;
            else if (name.contains("watch")) resolvedType = Category.SMARTWATCH;
            else if (name.contains("tablet") || name.contains("ipad")) resolvedType = Category.TABLET;
            else if (name.contains("audio") || name.contains("headphone") || name.contains("speaker")) resolvedType = Category.AUDIO;
            else resolvedType = Category.UNSUPPORTED;
        }

        RecycleRequest request = RecycleRequest.builder()
                .user(user)
                .productName(productName != null && !productName.isBlank() ? productName : "E-Waste Item")
                .weightKg(weightKg != null && weightKg > 0 ? weightKg : 1.0)
                .imageUrl(imageUrl)
                .deviceType(resolvedType)
                .status(RecycleStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();

        return recycleRequestRepository.save(request);
    }

    public List<RecycleRequest> getAllTasks() {
        return recycleRequestRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional
    public RecycleRequest acceptPickup(UUID requestId, User recycler) {
        RecycleRequest request = recycleRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Recycle request not found with id: " + requestId));

        request.setRecycler(recycler);
        request.setStatus(RecycleStatus.ACCEPTED);
        return recycleRequestRepository.save(request);
    }

    @Transactional
    public RecycleRequest acceptAndCompleteRecycling(UUID requestId, User recycler) {
        RecycleRequest request = recycleRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Recycle request not found with id: " + requestId));

        if (recycler != null) {
            request.setRecycler(recycler);
        }
        request.setStatus(RecycleStatus.RECYCLED);

        double weight = request.getWeightKg() != null ? request.getWeightKg() : 1.0;
        double creditedCo2 = Math.max(15.0, weight * 15.0);
        request.setCarbonCredits(creditedCo2);

        RecycleRequest saved = recycleRequestRepository.save(request);

        // Trigger gamification reward for the user who donated the e-waste
        carbonMathService.awardRecycling(request.getUser(), request.getDeviceType(), weight);

        return saved;
    }
}
