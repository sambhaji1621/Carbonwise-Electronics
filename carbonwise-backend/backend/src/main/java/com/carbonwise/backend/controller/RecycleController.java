package com.carbonwise.backend.controller;

import com.carbonwise.backend.dto.request.RecycleSubmissionRequest;
import com.carbonwise.backend.entity.Category;
import com.carbonwise.backend.entity.RecycleRequest;
import com.carbonwise.backend.entity.User;
import com.carbonwise.backend.repository.UserRepository;
import com.carbonwise.backend.service.RecycleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/recycle")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class RecycleController {

    private static final String UPLOAD_DIR = "uploads/";

    private final RecycleService recycleService;
    private final UserRepository userRepository;

    @PostMapping(value = "/submit", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> submitRecycleMultipart(
            @RequestParam("productName") String productName,
            @RequestParam("weightKg") Double weightKg,
            @RequestParam(value = "deviceType", required = false) Category deviceType,
            @RequestParam(value = "image", required = false) MultipartFile image,
            Principal principal) {
        
        if (productName == null || productName.trim().length() < 3) {
            return ResponseEntity.badRequest().body("Validation error: Device description must be at least 3 characters.");
        }
        if (weightKg == null || weightKg <= 0.0 || weightKg > 1000.0) {
            return ResponseEntity.badRequest().body("Validation error: Weight must be a positive number between 0.1 and 1000 kg.");
        }
        if (image == null || image.isEmpty()) {
            return ResponseEntity.badRequest().body("Validation error: Device photo is mandatory for pickup.");
        }

        User user = userRepository.findByPhone(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String imageUrl = saveUploadedFile(image);
        
        return ResponseEntity.ok(recycleService.createPickupRequest(
                user,
                productName.trim(),
                weightKg,
                deviceType,
                imageUrl
        ));
    }

    @PostMapping(value = "/submit", consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RecycleRequest> submitRecycleJson(
            @RequestBody RecycleSubmissionRequest request,
            Principal principal) {
        
        User user = userRepository.findByPhone(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        return ResponseEntity.ok(recycleService.createPickupRequest(
                user,
                request.getProductName(),
                request.getWeightKg(),
                request.getDeviceType(),
                null
        ));
    }

    @PostMapping("/request")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RecycleRequest> requestPickup(
            @RequestParam("deviceType") Category deviceType,
            Principal principal) {
        
        User user = userRepository.findByPhone(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(recycleService.createPickupRequest(user, deviceType));
    }

    @GetMapping("/tasks")
    @PreAuthorize("hasRole('ROLE_RECYCLER') or hasRole('RECYCLER')")
    public ResponseEntity<List<RecycleRequest>> getRecyclingTasks() {
        return ResponseEntity.ok(recycleService.getAllTasks());
    }

    @PutMapping("/{requestId}/accept")
    @PreAuthorize("hasRole('ROLE_RECYCLER') or hasRole('RECYCLER')")
    public ResponseEntity<RecycleRequest> acceptPickup(
            @PathVariable UUID requestId,
            Principal principal) {
        
        User recycler = userRepository.findByPhone(principal.getName())
                .orElseThrow(() -> new RuntimeException("Recycler user not found"));
        return ResponseEntity.ok(recycleService.acceptPickup(requestId, recycler));
    }

    @PutMapping("/{requestId}/complete")
    @PreAuthorize("hasRole('ROLE_RECYCLER') or hasRole('RECYCLER')")
    public ResponseEntity<RecycleRequest> markAsRecycled(
            @PathVariable UUID requestId,
            Principal principal) {
        
        User recycler = userRepository.findByPhone(principal.getName())
                .orElseThrow(() -> new RuntimeException("Recycler user not found"));
        return ResponseEntity.ok(recycleService.acceptAndCompleteRecycling(requestId, recycler));
    }

    private String saveUploadedFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=500&q=80";
        }
        try {
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String originalName = file.getOriginalFilename();
            String extension = ".jpg";
            if (originalName != null && originalName.contains(".")) {
                extension = originalName.substring(originalName.lastIndexOf("."));
            }

            String fileName = "recycle-" + UUID.randomUUID().toString() + extension;
            Path targetLocation = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            return "http://localhost:8080/api/products/images/" + fileName;
        } catch (IOException e) {
            log.error("Failed to store uploaded recycle image locally", e);
            return "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=500&q=80";
        }
    }
}
