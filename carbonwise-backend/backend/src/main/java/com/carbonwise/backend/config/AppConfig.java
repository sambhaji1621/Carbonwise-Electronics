package com.carbonwise.backend.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
@EnableAsync
public class AppConfig {

    @Bean
    public WebClient webClient() {
        return WebClient.builder().build();
    }

    // Explicitly defining the ObjectMapper bean for GeminiClientService
    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper();
    }
}