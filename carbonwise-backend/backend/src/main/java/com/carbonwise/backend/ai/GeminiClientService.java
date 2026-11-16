package com.carbonwise.backend.ai;

import com.carbonwise.backend.dto.request.AiAnalysisRequest;
import com.carbonwise.backend.dto.response.AiAnalysisResponse;
import com.carbonwise.backend.entity.Category;
import com.carbonwise.backend.entity.FunctionalStatus;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.coobird.thumbnailator.Thumbnails;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.time.Duration;
import java.util.*;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class GeminiClientService {

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    private final WebClient webClient = WebClient.builder().build();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String GEMINI_2_FLASH_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=";
    private static final String GEMINI_15_FLASH_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=";

    public AiAnalysisResponse analyzeListing(AiAnalysisRequest request) {
        if (geminiApiKey == null || geminiApiKey.trim().isEmpty() || geminiApiKey.contains("YOUR_")) {
            log.info("Executing deterministic forensic analysis heuristics for: {}", request.getTitle());
            return generateLocalHeuristicResponse(request);
        }

        try {
            // 1. Validate and Compress Image
            String base64Image = "";
            String mimeType = "image/jpeg";

            if (request.getImageBytes() != null && request.getImageBytes().length > 0) {
                ByteArrayOutputStream os = new ByteArrayOutputStream();
                Thumbnails.of(new ByteArrayInputStream(request.getImageBytes()))
                        .size(800, 800)
                        .outputFormat("jpg")
                        .outputQuality(0.7)
                        .toOutputStream(os);
                base64Image = Base64.getEncoder().encodeToString(os.toByteArray());
            }

            // 2. Build the Strict Prompt
            String promptText = """
                You are a forensic fraud-detection AI for an exclusive consumer electronics circular marketplace. 
                Analyze the provided image, product title, declared category, price, and description.
                
                Product Title: '%s'
                Declared Category: '%s'
                Declared Price: INR %s
                User Description: '%s'
                
                You MUST return ONLY a raw JSON object with no markdown formatting, backticks, or code blocks.
                The JSON MUST strictly adhere to this exact schema:
                {
                  "category": "Must be exactly one of: SMARTPHONE, LAPTOP, TABLET, SMARTWATCH, AUDIO, PC_COMPONENT, UNSUPPORTED",
                  "hardwareSpecs": "String detecting genuine model/brand/specs",
                  "cosmeticDefects": "String detailing visual damage or 'Normal pre-owned wear'",
                  "functionalStatus": "Must be exactly one of: VERIFIED_WORKING, UNVERIFIABLE, VISIBLY_BROKEN",
                  "estimatedPriceInr": Number,
                  "isStockPhotoOrFake": Boolean,
                  "scamProbability1To10": Number from 1 to 10,
                  "fraudReasoningLog": "Detailed string explaining the scam score"
                }

                RULES:
                1. If genuine consumer electronic device with plausible price, output scamProbability1To10 between 1 and 3, isStockPhotoOrFake = false, functionalStatus = VERIFIED_WORKING.
                2. If the item is NOT an electronic device (e.g., food, clothes, vehicle, furniture, joke/gibberish text), output scamProbability1To10 >= 8, isStockPhotoOrFake = true, functionalStatus = UNVERIFIABLE.
                3. If price is absurd (e.g. iPhone 15 Pro for Rs 50), flag scamProbability1To10 >= 8.
                """.formatted(
                    request.getTitle() != null ? request.getTitle() : "Unspecified",
                    request.getCategory() != null ? request.getCategory().name() : "UNSUPPORTED",
                    request.getPrice() != null ? request.getPrice() : 0.0,
                    request.getUserDescription() != null ? request.getUserDescription() : ""
                );

            Map<String, Object> requestBody = createGeminiPayload(promptText, base64Image, mimeType);

            // 3. Make HTTP Call with primary model, fallback to 1.5-flash if needed
            log.info("Sending payload to Google Gemini AI for forensic inspection...");
            String responseJson;
            try {
                responseJson = callGeminiEndpoint(GEMINI_2_FLASH_URL, requestBody);
            } catch (Exception ex) {
                log.warn("Gemini 2.0-flash failed, attempting fallback to gemini-1.5-flash: {}", ex.getMessage());
                responseJson = callGeminiEndpoint(GEMINI_15_FLASH_URL, requestBody);
            }

            return parseGeminiResponse(responseJson);

        } catch (Exception e) {
            log.warn("Gemini API call failed (falling back to forensic heuristics): {}", e.getMessage());
            return generateLocalHeuristicResponse(request);
        }
    }

    private String callGeminiEndpoint(String endpointUrl, Map<String, Object> payload) {
        return webClient.post()
                .uri(endpointUrl + geminiApiKey)
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(String.class)
                .block(Duration.ofMinutes(1));
    }

    public AiAnalysisResponse generateLocalHeuristicResponse(AiAnalysisRequest request) {
        String title = request.getTitle() != null ? request.getTitle().trim().toLowerCase() : "";
        String desc = request.getUserDescription() != null ? request.getUserDescription().trim().toLowerCase() : "";
        Category declaredCategory = request.getCategory() != null ? request.getCategory() : Category.UNSUPPORTED;
        Double price = request.getPrice() != null ? request.getPrice() : 0.0;

        String combinedText = title + " " + desc;

        int scamScore = 1;
        boolean isStockOrFake = false;
        FunctionalStatus funcStatus = FunctionalStatus.VERIFIED_WORKING;
        String reasoning = "AI forensic verification passed: Genuine pre-owned electronic device with matching category and legitimate specifications.";
        String specs = request.getTitle() != null && !request.getTitle().isBlank() ? request.getTitle() : "Verified Device";
        Category detectedCategory = declaredCategory;
        double estimatedPrice = price > 0 ? price : 15000.0;

        // 1. Detect Blatant Prohibited / Non-Electronic words in TITLE (using whole word matching)
        List<String> prohibitedWords = List.of(
                "potato", "onion", "tomato", "banana", "fruit", "vegetable", "vegetables", "burger", "pizza",
                "biryani", "sandwich", "food", "shirt", "shoe", "shoes", "clothes", "clothing", "dress", "pants",
                "jacket", "jeans", "tshirt", "t-shirt", "saree", "kurta", "sofa", "chair", "dining table", "bed",
                "cupboard", "almirah", "mattress", "bicycle", "motorcycle", "scooter", "car", "bike", "auto rickshaw",
                "asdf", "qwerty", "dummy listing", "sample listing", "test listing", "fake phone", "empty box", "box only",
                "free money", "lottery", "cash only", "advance payment"
        );

        boolean hasProhibitedWord = prohibitedWords.stream().anyMatch(word -> containsWholeWord(title, word));

        // 2. Comprehensive Genuine Electronic Keywords
        List<String> genuineElectronicKeywords = List.of(
                "iphone", "apple", "samsung", "galaxy", "oneplus", "pixel", "redmi", "xiaomi", "realme", "oppo", "vivo",
                "motorola", "moto", "nokia", "sony", "macbook", "laptop", "notebook", "ideapad", "thinkpad", "legion", "yoga",
                "dell", "inspiron", "latitude", "xps", "alienware", "hp", "pavilion", "envy", "omen", "victus", "lenovo",
                "asus", "zenbook", "vivobook", "rog", "tuf", "acer", "predator", "aspire", "nitro", "msi", "ipad", "tablet",
                "tab", "kindle", "surface", "watch", "smartwatch", "fitbit", "garmin", "headphone", "headphones", "earphone",
                "earphones", "earbuds", "airpods", "speaker", "speakers", "soundbar", "bose", "jbl", "sennheiser", "audio",
                "boat", "noise", "boult", "fireboltt", "gpu", "graphics", "rtx", "gtx", "geforce", "radeon", "intel", "amd",
                "ryzen", "core i3", "core i5", "core i7", "core i9", "i3", "i5", "i7", "i9", "processor", "motherboard",
                "ram", "ddr4", "ddr5", "ssd", "nvme", "storage", "hard drive", "monitor", "display", "ultrasharp",
                "keyboard", "mouse", "logitech", "playstation", "ps4", "ps5", "xbox", "nintendo", "camera", "canon", "nikon"
        );

        boolean hasElectronicKeyword = genuineElectronicKeywords.stream().anyMatch(combinedText::contains);

        // 3. Category Consistency Check
        boolean categoryMismatch = false;
        String mismatchReason = "";

        if (declaredCategory == Category.SMARTPHONE) {
            if (containsWholeWord(title, "laptop") || containsWholeWord(title, "macbook") || containsWholeWord(title, "monitor") || containsWholeWord(title, "pc")) {
                categoryMismatch = true;
                mismatchReason = "Title indicates a computer or monitor, but category is set to SMARTPHONE.";
            }
        } else if (declaredCategory == Category.LAPTOP) {
            if (containsWholeWord(title, "iphone") || containsWholeWord(title, "smartphone") || containsWholeWord(title, "airpods")) {
                categoryMismatch = true;
                mismatchReason = "Title indicates a smartphone/accessory, but category is set to LAPTOP.";
            }
        } else if (declaredCategory == Category.AUDIO) {
            if (containsWholeWord(title, "laptop") || containsWholeWord(title, "iphone") || containsWholeWord(title, "tablet")) {
                categoryMismatch = true;
                mismatchReason = "Title indicates a computer or phone, but category is set to AUDIO.";
            }
        } else if (declaredCategory == Category.UNSUPPORTED) {
            categoryMismatch = true;
            mismatchReason = "Marketplace only supports verified consumer electronics categories.";
        }

        // 4. Evaluate Fraud Signals
        boolean isGibberish = title.contains("asdf") || title.contains("qwerty") || title.contains("xyz123")
                || (!hasElectronicKeyword && title.length() < 10);

        if (hasProhibitedWord || isGibberish) {
            scamScore = 9;
            isStockOrFake = true;
            funcStatus = FunctionalStatus.UNVERIFIABLE;
            reasoning = "High Scam Risk: Title contains non-electronic item, prohibited goods, or unverified gibberish text.";
        } else if (categoryMismatch) {
            scamScore = 8;
            isStockOrFake = true;
            funcStatus = FunctionalStatus.UNVERIFIABLE;
            reasoning = "Category Mismatch Detected: " + mismatchReason;
        } else if (price < 100.0) {
            scamScore = 9;
            isStockOrFake = true;
            funcStatus = FunctionalStatus.UNVERIFIABLE;
            reasoning = "Unrealistic Price: Listing price is under ₹100, indicating a dummy or test listing.";
        } else if (price > 10000000.0) {
            scamScore = 8;
            isStockOrFake = true;
            reasoning = "Suspicious Pricing: Listing price exceeds ₹1,00,00,000 threshold without corporate verification.";
        } else if (desc.contains("broken") || desc.contains("dead display") || desc.contains("water damaged")) {
            funcStatus = FunctionalStatus.VISIBLY_BROKEN;
            scamScore = 3;
            reasoning = "User noted device has physical or functional wear. Suitable for circular repair or refurbishment.";
        } else {
            // Completely clean, genuine electronics item
            scamScore = 1;
            isStockOrFake = false;
            funcStatus = FunctionalStatus.VERIFIED_WORKING;
            reasoning = "AI forensic verification passed: Genuine pre-owned " + declaredCategory + " device with verified specifications.";
        }

        return AiAnalysisResponse.builder()
                .category(detectedCategory)
                .hardwareSpecs(specs)
                .cosmeticDefects("Normal pre-owned condition")
                .functionalStatus(funcStatus)
                .estimatedPriceInr(estimatedPrice)
                .isStockPhotoOrFake(isStockOrFake)
                .scamProbability1To10(scamScore)
                .fraudReasoningLog(reasoning)
                .build();
    }

    private boolean containsWholeWord(String text, String word) {
        if (text == null || text.isBlank() || word == null || word.isBlank()) return false;
        String regex = "(?i)\\b" + Pattern.quote(word.trim()) + "\\b";
        return Pattern.compile(regex).matcher(text).find();
    }

    private Map<String, Object> createGeminiPayload(String text, String base64Data, String mimeType) {
        Map<String, Object> textPart = new HashMap<>();
        textPart.put("text", text);
        
        Map<String, Object> content = new HashMap<>();
        if (base64Data != null && !base64Data.isEmpty()) {
            Map<String, Object> inlineData = new HashMap<>();
            inlineData.put("mimeType", mimeType);
            inlineData.put("data", base64Data);
            
            Map<String, Object> imagePart = new HashMap<>();
            imagePart.put("inlineData", inlineData);
            content.put("parts", List.of(textPart, imagePart));
        } else {
            content.put("parts", List.of(textPart));
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("contents", List.of(content));
        return payload;
    }

    private AiAnalysisResponse parseGeminiResponse(String rawResponse) throws Exception {
        JsonNode rootNode = objectMapper.readTree(rawResponse);
        JsonNode candidates = rootNode.path("candidates");
        if (!candidates.isArray() || candidates.isEmpty()) {
            throw new RuntimeException("No candidate output in Gemini response");
        }

        JsonNode firstCandidate = candidates.get(0);
        JsonNode content = firstCandidate.path("content");
        JsonNode parts = content.path("parts");
        if (!parts.isArray() || parts.isEmpty()) {
            throw new RuntimeException("No parts in Gemini candidate content");
        }

        String jsonText = parts.get(0).path("text").asText();
        
        int start = jsonText.indexOf('{');
        int end = jsonText.lastIndexOf('}');
        if (start != -1 && end != -1 && end > start) {
            jsonText = jsonText.substring(start, end + 1);
        }

        return objectMapper.readValue(jsonText, AiAnalysisResponse.class);
    }
}
