package com.carbonwise.backend.service;

import com.carbonwise.backend.entity.*;
import com.carbonwise.backend.repository.OrderRepository;
import com.carbonwise.backend.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final CarbonMathService carbonMathService;

    @Transactional
    public Order initiatePurchase(UUID productId, User buyer, DeliveryMethod method, Double amountPaid, String paymentId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));

        if (product.getSeller() != null && product.getSeller().getId().equals(buyer.getId())) {
            throw new RuntimeException("You cannot buy your own product listing.");
        }
        if (product.getStatus() == ListingStatus.SOLD) {
            throw new RuntimeException("This product has already been sold.");
        }
        if (product.getStatus() != ListingStatus.ACTIVE) {
            throw new RuntimeException("This product is not currently available for purchase.");
        }

        // Mark product as sold so it disappears from the active marketplace feed
        product.setStatus(ListingStatus.SOLD);
        productRepository.save(product);

        String rawData = (method == DeliveryMethod.LOCAL_QR ? "LOCAL-" : "COURIER-")
                + productId.toString() + buyer.getId().toString() + System.currentTimeMillis();
        String qrHash = generateSha256(rawData);

        Double calculatedAmount = amountPaid;
        if (calculatedAmount == null || calculatedAmount <= 0) {
            calculatedAmount = product.getPrice() != null ? product.getPrice() : 0.0;
            if (method == DeliveryMethod.COURIER) {
                calculatedAmount += 150.0;
            }
        }

        Order order = Order.builder()
                .product(product)
                .buyer(buyer)
                .paymentId(paymentId != null ? paymentId : "ESCROW-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .amountPaid(calculatedAmount)
                .escrowStatus(EscrowStatus.PAYMENT_HELD)
                .deliveryMethod(method != null ? method : DeliveryMethod.LOCAL_QR)
                .qrHash(qrHash)
                .createdAt(LocalDateTime.now())
                .build();

        log.info("Order initiated successfully: {} by buyer: {}", order.getId(), buyer.getPhone());
        return orderRepository.save(order);
    }

    @Transactional
    public Order initiatePurchase(UUID productId, User buyer, DeliveryMethod method, String paymentId) {
        return initiatePurchase(productId, buyer, method, null, paymentId);
    }

    public List<Order> getBuyerOrders(User buyer) {
        return orderRepository.findByBuyerOrderByCreatedAtDesc(buyer);
    }

    public List<Order> getSellerOrders(User seller) {
        return orderRepository.findByProductSellerOrderByCreatedAtDesc(seller);
    }

    @Transactional
    public String verifyAndReleaseEscrow(UUID orderId, String scannedQrHash, User currentUser) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));

        // 1. Guard against double-release
        if (order.getEscrowStatus() == EscrowStatus.RELEASED) {
            throw new RuntimeException("Escrow funds have already been released for this order.");
        }

        boolean isSeller = order.getProduct() != null && order.getProduct().getSeller() != null
                && order.getProduct().getSeller().getId().equals(currentUser.getId());
        boolean isBuyer = order.getBuyer() != null
                && order.getBuyer().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == Role.ROLE_ADMIN;

        if (!isSeller && !isBuyer && !isAdmin) {
            throw new RuntimeException("Unauthorized: You are not a party to this order.");
        }

        // 2. If seller is verifying, validate the handover code
        if (isSeller) {
            if (scannedQrHash == null || scannedQrHash.trim().isEmpty()) {
                throw new RuntimeException("Please enter the 8-character handover code displayed on the buyer's screen.");
            }
            String input = scannedQrHash.trim().replaceAll("(?i)^cw-", "").replaceAll("-", "").toLowerCase();
            String fullHash = order.getQrHash() != null ? order.getQrHash().toLowerCase() : "";
            String shortHash = fullHash.length() >= 8 ? fullHash.substring(0, 8) : fullHash;
            String orderIdStr = order.getId().toString().toLowerCase().replaceAll("-", "");
            String shortOrderId = orderIdStr.substring(0, Math.min(8, orderIdStr.length()));

            boolean matched = fullHash.equalsIgnoreCase(input)
                    || shortHash.equalsIgnoreCase(input)
                    || orderIdStr.equalsIgnoreCase(input)
                    || shortOrderId.equalsIgnoreCase(input)
                    || (order.getQrHash() != null && order.getQrHash().equalsIgnoreCase(scannedQrHash.trim()));

            if (!matched) {
                throw new RuntimeException("Invalid handover code. Please check the 8-character code shown on the buyer's screen.");
            }
        }

        // 3. Mark Escrow as RELEASED
        order.setEscrowStatus(EscrowStatus.RELEASED);
        orderRepository.save(order);

        // 4. Trigger Carbon Engine Gamification
        carbonMathService.awardMarketplaceTransaction(
                order.getBuyer(),
                order.getProduct().getSeller(),
                order.getProduct().getCategory(),
                order.getDeliveryMethod() != null ? order.getDeliveryMethod() : DeliveryMethod.LOCAL_QR,
                0.0
        );

        log.info("Escrow released successfully for order ID: {} by user: {}", orderId, currentUser.getPhone());

        if (isSeller) {
            return "Escrow Released! ₹" + order.getAmountPaid() + " has been released to your account. Carbon credits awarded!";
        } else if (isBuyer) {
            return "Delivery confirmed! ₹" + order.getAmountPaid() + " escrow payment has been released to the seller. Carbon credits awarded!";
        } else {
            return "Admin override: Escrow released and carbon credits awarded.";
        }
    }

    @Transactional
    public String verifyLocalQrAndReleaseEscrow(UUID orderId, String scannedQrHash, User seller) {
        return verifyAndReleaseEscrow(orderId, scannedQrHash, seller);
    }

    private String generateSha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate QR hash", e);
        }
    }
}
