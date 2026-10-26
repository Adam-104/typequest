package com.typequest.config;

import com.typequest.model.Role;
import com.typequest.model.User;
import com.typequest.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Locale;

@Configuration
@ConditionalOnProperty(
        name = "typequest.admin.initializer.enabled",
        havingValue = "true",
        matchIfMissing = true
)
public class AdminAccountInitializer {

    @Bean
    CommandLineRunner initializeAdminAccount(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${typequest.admin.email:}") String adminEmail,
            @Value("${typequest.admin.password:}") String adminPassword) {

        return args -> {
            // Optional: without these settings no admin is created here.
            // An admin can also be made in the database:
            //   UPDATE users SET role = 'ROLE_ADMIN' WHERE email = '...';
            if (adminEmail.isBlank() || adminPassword.isBlank()) {
                System.out.println(
                        "No TYPEQUEST_ADMIN_EMAIL/PASSWORD set. Skipping admin provisioning."
                );
                return;
            }

            if (adminPassword.length() < 12) {
                throw new IllegalStateException(
                        "The configured admin password must be at least 12 characters."
                );
            }

            String normalizedEmail =
                    adminEmail.trim().toLowerCase(Locale.ROOT);

            var existingUser = userRepository.findByEmail(normalizedEmail);

            if (existingUser.isPresent()) {
                User user = existingUser.get();

                if ("admin".equals(user.getUsername())
                        && user.getRole() == Role.ROLE_ADMIN) {
                    System.out.println(
                            "TypeQuest admin account already exists. Skipping creation."
                    );
                    return;
                }

                throw new IllegalStateException(
                        "The configured admin email belongs to another account. "
                                + "Review it before provisioning an admin."
                );
            }

            if (userRepository.existsByUsername("admin")) {
                throw new IllegalStateException(
                        "Username 'admin' already belongs to another account."
                );
            }

            User admin = new User();
            admin.setUsername("admin");
            admin.setEmail(normalizedEmail);
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setRole(Role.ROLE_ADMIN);
            admin.setEmailVerified(true);

            userRepository.save(admin);

            System.out.println("TypeQuest admin account created successfully.");
        };
    }
}