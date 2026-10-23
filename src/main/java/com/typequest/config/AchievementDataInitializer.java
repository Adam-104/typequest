package com.typequest.config;

import com.typequest.service.AchievementService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AchievementDataInitializer {

    @Bean
    public CommandLineRunner initializeAchievementData(
            AchievementService achievementService
    ) {
        return args -> achievementService.initializeAchievements();
    }
}
