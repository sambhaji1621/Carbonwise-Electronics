package com.carbonwise.backend.controller;

import com.carbonwise.backend.dto.request.CreateOrderRequest;
import com.carbonwise.backend.entity.DeliveryMethod;
import com.carbonwise.backend.entity.Order;
import com.carbonwise.backend.entity.User;
import com.carbonwise.backend.repository.UserRepository;
import com.carbonwise.backend.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class OrderController {

    private final OrderService orderService;
    private final UserRepository userRepository;

    @PostMapping("/create")
    public ResponseEntity<?> createOrder(
            @RequestBody CreateOrderRequest request,
            Principal principal) {
        
        try {
            User buyer = userRepository.findByPhone(principal.getName())
                    .orElseThrow(() -> new RuntimeException("Buyer user not found"));

            DeliveryMethod method = request.getResolvedDeliveryMethod();
            Order order = orderService.initiatePurchase(
                    request.getProductId(),
                    buyer,
                    method,
                    request.getAmountPaid(),
                    request.getPaymentId()
            );

            return ResponseEntity.ok(order);
        } catch (Exception e) {
            log.error("Failed to create order: {}", e.getMessage());
            Map<String, String> err = new HashMap<>();
            err.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @PostMapping("/checkout")
    public ResponseEntity<?> checkout(
            @RequestParam(value = "productId", required = false) UUID paramProductId,
            @RequestParam(value = "deliveryMethod", required = false) DeliveryMethod paramDeliveryMethod,
            @RequestParam(value = "paymentId", required = false) String paramPaymentId,
            @RequestBody(required = false) CreateOrderRequest bodyRequest,
            Principal principal) {

        try {
            User buyer = userRepository.findByPhone(principal.getName())
                    .orElseThrow(() -> new RuntimeException("Buyer user not found"));

            UUID productId = (bodyRequest != null && bodyRequest.getProductId() != null) ? bodyRequest.getProductId() : paramProductId;
            DeliveryMethod method = (bodyRequest != null) ? bodyRequest.getResolvedDeliveryMethod() : paramDeliveryMethod;
            Double amountPaid = (bodyRequest != null) ? bodyRequest.getAmountPaid() : null;
            String paymentId = (bodyRequest != null && bodyRequest.getPaymentId() != null) ? bodyRequest.getPaymentId() : paramPaymentId;

            if (method == null) method = DeliveryMethod.LOCAL_QR;

            Order order = orderService.initiatePurchase(productId, buyer, method, amountPaid, paymentId);
            return ResponseEntity.ok(order);
        } catch (Exception e) {
            log.error("Failed checkout: {}", e.getMessage());
            Map<String, String> err = new HashMap<>();
            err.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @GetMapping("/my-orders")
    public ResponseEntity<List<Order>> getMyOrders(Principal principal) {
        User buyer = userRepository.findByPhone(principal.getName())
                .orElseThrow(() -> new RuntimeException("Buyer user not found"));
        return ResponseEntity.ok(orderService.getBuyerOrders(buyer));
    }

    @GetMapping("/my-sales")
    public ResponseEntity<List<Order>> getMySales(Principal principal) {
        User seller = userRepository.findByPhone(principal.getName())
                .orElseThrow(() -> new RuntimeException("Seller user not found"));
        return ResponseEntity.ok(orderService.getSellerOrders(seller));
    }

    @PostMapping("/{orderId}/verify-qr")
    public ResponseEntity<?> verifyQr(
            @PathVariable UUID orderId,
            @RequestParam(value = "scannedQrHash", required = false) String scannedQrHash,
            @RequestBody(required = false) Map<String, String> body,
            Principal principal) {

        try {
            String code = scannedQrHash;
            if (code == null && body != null) {
                code = body.get("scannedQrHash");
            }

            User currentUser = userRepository.findByPhone(principal.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            String resultMessage = orderService.verifyAndReleaseEscrow(orderId, code, currentUser);

            Map<String, String> responseBody = new HashMap<>();
            responseBody.put("message", resultMessage);
            return ResponseEntity.ok(responseBody);
        } catch (Exception e) {
            log.warn("Escrow verification failed for order {}: {}", orderId, e.getMessage());
            Map<String, String> err = new HashMap<>();
            err.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @PostMapping("/{orderId}/release")
    public ResponseEntity<?> releaseEscrow(
            @PathVariable UUID orderId,
            @RequestParam(value = "scannedQrHash", required = false) String scannedQrHash,
            @RequestBody(required = false) Map<String, String> body,
            Principal principal) {

        try {
            String code = scannedQrHash;
            if (code == null && body != null) {
                code = body.get("scannedQrHash");
            }

            User currentUser = userRepository.findByPhone(principal.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            String resultMessage = orderService.verifyAndReleaseEscrow(orderId, code, currentUser);

            Map<String, String> responseBody = new HashMap<>();
            responseBody.put("message", resultMessage);
            return ResponseEntity.ok(responseBody);
        } catch (Exception e) {
            log.warn("Escrow release failed for order {}: {}", orderId, e.getMessage());
            Map<String, String> err = new HashMap<>();
            err.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }
}
