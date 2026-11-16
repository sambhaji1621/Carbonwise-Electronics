package com.carbonwise.backend.controller;

import com.carbonwise.backend.dto.request.AiAnalysisRequest;
import com.carbonwise.backend.entity.Category;
import com.carbonwise.backend.entity.ListingStatus;
import com.carbonwise.backend.entity.Product;
import com.carbonwise.backend.entity.User;
import com.carbonwise.backend.repository.ProductRepository;
import com.carbonwise.backend.repository.UserRepository;
import com.carbonwise.backend.service.CarbonMathService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class ProductController {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final CarbonMathService carbonMathService;

    private static final String UPLOAD_DIR = "uploads";

    @PostMapping(value = "/add", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> addProduct(
            @RequestParam(value = "images", required = false) List<MultipartFile> images,
            @RequestParam(value = "image", required = false) MultipartFile singleImage,
            @RequestParam("description") String description,
            @RequestParam("title") String title,
            @RequestParam("price") Double price,
            @RequestParam("category") Category category,
            @RequestParam(value = "video", required = false) MultipartFile video) {

        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized: You must be logged in to create a listing.");
            }

            // Collect all uploaded photos
            List<MultipartFile> allUploadedFiles = new java.util.ArrayList<>();
            if (images != null && !images.isEmpty()) {
                allUploadedFiles.addAll(images.stream().filter(f -> f != null && !f.isEmpty()).toList());
            }
            if (allUploadedFiles.isEmpty() && singleImage != null && !singleImage.isEmpty()) {
                allUploadedFiles.add(singleImage);
            }
            if (allUploadedFiles.isEmpty()) {
                return ResponseEntity.badRequest().body("Validation error: At least one clear device photo is mandatory.");
            }
            if (allUploadedFiles.size() > 5) {
                allUploadedFiles = allUploadedFiles.subList(0, 5);
            }

            if (title == null || title.trim().length() < 3) {
                return ResponseEntity.badRequest().body("Validation error: Product title must be at least 3 characters.");
            }
            if (price == null || price <= 0.0 || price > 10000000.0) {
                return ResponseEntity.badRequest().body("Validation error: Price must be a positive amount in INR (minimum ₹1).");
            }
            if (description == null || description.trim().length() < 5) {
                return ResponseEntity.badRequest().body("Validation error: Description must be at least 5 characters.");
            }

            String phone = auth.getName();
            User seller = userRepository.findByPhone(phone)
                    .orElseThrow(() -> new RuntimeException("User not found for phone: " + phone));

            // 1. Save all uploaded images and optional video to disk
            List<String> storedImageUrls = allUploadedFiles.stream()
                    .map(this::saveUploadedFile)
                    .toList();
            String primaryImageUrl = storedImageUrls.get(0);
            String combinedImageUrls = String.join(";", storedImageUrls);
            String storedVideoUrl = (video != null && !video.isEmpty()) ? saveUploadedFile(video) : null;

            // 2. Save Initial Product
            Product product = Product.builder()
                    .title(title.trim())
                    .price(price)
                    .category(category != null ? category : Category.SMARTPHONE)
                    .description(description.trim())
                    .imageUrl(primaryImageUrl)
                    .imageUrls(combinedImageUrls)
                    .videoUrl(storedVideoUrl)
                    .status(ListingStatus.PENDING_AI_PROCESSING)
                    .seller(seller)
                    .createdAt(LocalDateTime.now())
                    .build();

            Product savedProduct = productRepository.saveAndFlush(product);

            // 3. Extract primary image bytes for AI forensic analysis
            MultipartFile primaryImage = allUploadedFiles.get(0);
            byte[] imageBytes = primaryImage.getBytes();
            String mimeType = primaryImage.getContentType() != null ? primaryImage.getContentType() : "image/jpeg";
            AiAnalysisRequest aiRequest = AiAnalysisRequest.builder()
                    .productId(savedProduct.getId())
                    .title(title.trim())
                    .price(price)
                    .category(category != null ? category : Category.SMARTPHONE)
                    .userDescription(description.trim())
                    .imageBytes(imageBytes)
                    .mimeType(mimeType)
                    .build();

            // 4. Perform direct AI forensic evaluation (instantly approves clean listings to ACTIVE)
            Product evaluatedProduct = carbonMathService.evaluateProductDirectly(savedProduct, aiRequest);

            return ResponseEntity.ok(evaluatedProduct);

        } catch (Exception e) {
            log.error("Failed to add product listing", e);
            return ResponseEntity.internalServerError().body("Failed to save product: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<Product>> getAllActiveProducts() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equalsIgnoreCase(auth.getName())) {
            Optional<User> currentUserOpt = userRepository.findByPhone(auth.getName());
            if (currentUserOpt.isPresent()) {
                return ResponseEntity.ok(productRepository.findByStatusAndSellerIdNot(ListingStatus.ACTIVE, currentUserOpt.get().getId()));
            }
        }
        return ResponseEntity.ok(productRepository.findByStatusOrderByCreatedAtDesc(ListingStatus.ACTIVE));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProductById(@PathVariable UUID id) {
        return productRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/my-listings")
    public ResponseEntity<List<Product>> getMyListings() {
        String phone = SecurityContextHolder.getContext().getAuthentication().getName();
        User seller = userRepository.findByPhone(phone).orElseThrow();
        return ResponseEntity.ok(productRepository.findBySeller(seller));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable UUID id) {
        String phone = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByPhone(phone).orElseThrow();

        return productRepository.findById(id).map(product -> {
            boolean isOwner = product.getSeller() != null && product.getSeller().getId().equals(currentUser.getId());
            boolean isAdmin = currentUser.getRole().name().equals("ROLE_ADMIN");

            if (!isOwner && !isAdmin) {
                return ResponseEntity.status(403).body("Unauthorized to delete this listing.");
            }

            product.setStatus(ListingStatus.DELETED);
            productRepository.save(product);
            return ResponseEntity.ok("Listing marked as deleted.");
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/images/{fileName:.+}")
    public ResponseEntity<Resource> serveImage(@PathVariable String fileName) {
        try {
            Path filePath = Paths.get(UPLOAD_DIR).resolve(fileName).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                String contentType = Files.probeContentType(filePath);
                if (contentType == null) {
                    contentType = "application/octet-stream";
                }
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    private String saveUploadedFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return "https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=500&q=80";
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

            String fileName = UUID.randomUUID().toString() + extension;
            Path targetLocation = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            return "http://localhost:8080/api/products/images/" + fileName;
        } catch (IOException e) {
            log.error("Failed to store uploaded file locally", e);
            return "https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=500&q=80";
        }
    }
}
