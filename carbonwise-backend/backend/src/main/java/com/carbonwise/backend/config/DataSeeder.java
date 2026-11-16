package com.carbonwise.backend.config;

import com.carbonwise.backend.entity.*;
import com.carbonwise.backend.repository.OrderRepository;
import com.carbonwise.backend.repository.ProductRepository;
import com.carbonwise.backend.repository.RecycleRequestRepository;
import com.carbonwise.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final RecycleRequestRepository recycleRequestRepository;
    private final OrderRepository orderRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        try {
            seedUsersAndData();
        } catch (Exception e) {
            log.warn("DataSeeder notice (db may still be initializing): {}", e.getMessage());
        }
    }

    private void seedUsersAndData() {
        if (userRepository.count() > 0) {
            log.info("Database already contains users. Skipping initial seed.");
            return;
        }

        log.info("Seeding initial accounts, marketplace products, and recycling pipeline...");

        // 1. Admin Account
        User admin = User.builder()
                .name("Admin Superuser")
                .phone("9999999999")
                .password(passwordEncoder.encode("admin123"))
                .role(Role.ROLE_ADMIN)
                .city("Pune")
                .pinCode("411001")
                .carbonCredits(BigDecimal.valueOf(500.0))
                .accountHealth(100)
                .createdAt(LocalDateTime.now())
                .build();
        userRepository.save(admin);

        // 2. Recycler Account
        User recycler = User.builder()
                .name("EcoLoop Recovery Partner")
                .phone("8888888888")
                .password(passwordEncoder.encode("recycler123"))
                .role(Role.ROLE_RECYCLER)
                .city("Pune")
                .pinCode("411014")
                .carbonCredits(BigDecimal.valueOf(1250.0))
                .accountHealth(100)
                .createdAt(LocalDateTime.now())
                .build();
        userRepository.save(recycler);

        // 3. Standard Citizen / Trader Account
        User user = User.builder()
                .name("Aarav Sharma")
                .phone("7777777777")
                .password(passwordEncoder.encode("user123"))
                .role(Role.ROLE_USER)
                .city("Pune")
                .pinCode("411038")
                .carbonCredits(BigDecimal.valueOf(85.0))
                .accountHealth(100)
                .createdAt(LocalDateTime.now())
                .build();
        User savedUser = userRepository.save(user);

        // 4. Active Marketplace Listings
        Product p1 = Product.builder()
                .title("Apple iPhone 14 Pro 128GB - Deep Purple")
                .price(62000.0)
                .category(Category.SMARTPHONE)
                .description("Battery health 89%. Kept in Spigen case with tempered glass from day one. Box and cable included.")
                .imageUrl("https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&q=80")
                .status(ListingStatus.ACTIVE)
                .seller(savedUser)
                .hardwareSpecs("Apple iPhone 14 Pro A2890")
                .cosmeticDefects("Clean screen, minor pin-sized scuff on lower steel frame")
                .functionalStatus(FunctionalStatus.VERIFIED_WORKING)
                .estimatedPriceInr(64000.0)
                .isStockPhotoOrFake(false)
                .scamProbability1To10(1)
                .aiFraudReasoning("AI forensic verification passed: IMEI metadata, genuine photo lighting, and verified price range.")
                .createdAt(LocalDateTime.now().minusHours(5))
                .build();

        Product p2 = Product.builder()
                .title("Dell XPS 13 9310 - Intel i7, 16GB RAM, 512GB SSD")
                .price(54000.0)
                .category(Category.LAPTOP)
                .description("Used for software dev. FHD+ InfinityEdge display, smooth keyboard and trackpad. Original 65W charger.")
                .imageUrl("https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=600&q=80")
                .status(ListingStatus.ACTIVE)
                .seller(savedUser)
                .hardwareSpecs("Dell XPS 13 9310 Core i7-1185G7")
                .cosmeticDefects("Very faint palm-rest wear, no dead pixels")
                .functionalStatus(FunctionalStatus.VERIFIED_WORKING)
                .estimatedPriceInr(56000.0)
                .isStockPhotoOrFake(false)
                .scamProbability1To10(2)
                .aiFraudReasoning("AI forensic verification passed: Authenticated chassis, matching thermal exhaust pattern.")
                .createdAt(LocalDateTime.now().minusHours(8))
                .build();

        Product p3 = Product.builder()
                .title("Sony WH-1000XM4 Wireless Noise Cancelling Headphones")
                .price(14500.0)
                .category(Category.AUDIO)
                .description("Includes travel case, airplane adapter, and 3.5mm cable. Noise cancelling is legendary.")
                .imageUrl("https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80")
                .status(ListingStatus.ACTIVE)
                .seller(savedUser)
                .hardwareSpecs("Sony WH-1000XM4 Silver")
                .cosmeticDefects("Ear cushions clean, minor headband crease")
                .functionalStatus(FunctionalStatus.VERIFIED_WORKING)
                .estimatedPriceInr(16000.0)
                .isStockPhotoOrFake(false)
                .scamProbability1To10(1)
                .aiFraudReasoning("AI forensic verification passed: Genuine Sony earcup geometry detected.")
                .createdAt(LocalDateTime.now().minusDays(1))
                .build();

        Product p4 = Product.builder()
                .title("Apple iPad Air 5th Gen (M1, 64GB Space Grey)")
                .price(38000.0)
                .category(Category.TABLET)
                .description("Apple M1 chip, lightning fast for notes and sketching. Screen has paperlike matte protector.")
                .imageUrl("https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&q=80")
                .status(ListingStatus.ACTIVE)
                .seller(savedUser)
                .hardwareSpecs("Apple iPad Air 5th Generation M1")
                .cosmeticDefects("Pristine condition, always in folio case")
                .functionalStatus(FunctionalStatus.VERIFIED_WORKING)
                .estimatedPriceInr(40000.0)
                .isStockPhotoOrFake(false)
                .scamProbability1To10(1)
                .aiFraudReasoning("AI forensic verification passed: Verified M1 chassis edges and display proportions.")
                .createdAt(LocalDateTime.now().minusDays(2))
                .build();

        // 5. Flagged listing for Admin Review
        Product pFlagged = Product.builder()
                .title("Brand New Sealed iPhone 15 Pro Max 1TB - Urgent Sale")
                .price(15000.0)
                .category(Category.SMARTPHONE)
                .description("Need cash urgently tonight. Sealed box, deliver anywhere for free.")
                .imageUrl("https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600&q=80")
                .status(ListingStatus.PENDING_ADMIN_REVIEW)
                .seller(savedUser)
                .hardwareSpecs("Apple iPhone 15 Pro Max")
                .cosmeticDefects("Stock retail render detected")
                .functionalStatus(FunctionalStatus.UNVERIFIABLE)
                .estimatedPriceInr(135000.0)
                .isStockPhotoOrFake(true)
                .scamProbability1To10(9)
                .aiFraudReasoning("High Risk Flag: Listed price (₹15,000) is 88% lower than estimated market value (₹1,35,000). Image matches downloaded retail catalog render.")
                .createdAt(LocalDateTime.now().minusHours(1))
                .build();

        productRepository.save(p1);
        productRepository.save(p2);
        productRepository.save(p3);
        productRepository.save(p4);
        productRepository.save(pFlagged);

        // 6. Seed Recycling Requests
        RecycleRequest r1 = RecycleRequest.builder()
                .user(savedUser)
                .productName("Dead HP LaserJet 1020 Plus Printer")
                .weightKg(5.2)
                .deviceType(Category.PC_COMPONENT)
                .status(RecycleStatus.PENDING)
                .createdAt(LocalDateTime.now().minusHours(2))
                .build();

        RecycleRequest r2 = RecycleRequest.builder()
                .user(savedUser)
                .recycler(recycler)
                .productName("Water Damaged Samsung Galaxy Note 9")
                .weightKg(0.25)
                .deviceType(Category.SMARTPHONE)
                .status(RecycleStatus.ACCEPTED)
                .createdAt(LocalDateTime.now().minusHours(6))
                .build();

        RecycleRequest r3 = RecycleRequest.builder()
                .user(savedUser)
                .recycler(recycler)
                .productName("Flickering Dell 19-inch Monitor")
                .weightKg(3.8)
                .carbonCredits(57.0)
                .deviceType(Category.PC_COMPONENT)
                .status(RecycleStatus.RECYCLED)
                .createdAt(LocalDateTime.now().minusDays(1))
                .build();

        recycleRequestRepository.save(r1);
        recycleRequestRepository.save(r2);
        recycleRequestRepository.save(r3);

        log.info("Initial seed completed successfully! Test accounts: Admin (9999999999 / admin123), Recycler (8888888888 / recycler123), User (7777777777 / user123)");
    }
}
