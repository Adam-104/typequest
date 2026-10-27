package com.typequest.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private static final String BREVO_URL = "https://api.brevo.com/v3/smtp/email";

    private final JavaMailSender mailSender;
    private final String fromEmail;
    private final String brevoApiKey;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    // When typequest.mail.brevo-api-key is set, mail goes out over HTTPS (port
    // 443) through Brevo's API. Many free hosts (Render included) block the
    // SMTP ports, so SMTP only works there on a paid plan. Without the key the
    // classic SMTP sender is used, which is fine on a laptop.
    public EmailService(
            JavaMailSender mailSender,
            @Value("${typequest.mail.from}") String fromEmail,
            @Value("${typequest.mail.brevo-api-key:}") String brevoApiKey) {

        this.mailSender = mailSender;
        this.fromEmail = fromEmail;
        this.brevoApiKey = brevoApiKey == null ? "" : brevoApiKey.trim();
    }

    // Single exit for every message. Failures are always MailException so the
    // callers' existing handling keeps working.
    private void deliver(String recipient, String subject, String text) {
        if (brevoApiKey.isEmpty()) {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(recipient);
            message.setSubject(subject);
            message.setText(text);
            mailSender.send(message);
            return;
        }

        String json = "{\"sender\":{\"name\":\"TypeQuest\",\"email\":" + quote(fromEmail) + "},"
                + "\"to\":[{\"email\":" + quote(recipient) + "}],"
                + "\"subject\":" + quote(subject) + ","
                + "\"textContent\":" + quote(text) + "}";

        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(BREVO_URL))
                    .timeout(Duration.ofSeconds(10))
                    .header("api-key", brevoApiKey)
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .build();

            HttpResponse<String> response =
                    httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() / 100 != 2) {
                // The body names the reason (bad key, unverified sender...).
                log.warn("Brevo rejected the email: HTTP {} {}",
                        response.statusCode(), response.body());
                throw new MailSendException("Brevo returned HTTP " + response.statusCode());
            }
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new MailSendException("Sending the email was interrupted.", exception);
        } catch (java.io.IOException | IllegalArgumentException exception) {
            throw new MailSendException("Could not reach Brevo: " + exception.getMessage(), exception);
        }
    }

    private static String quote(String value) {
        StringBuilder out = new StringBuilder("\"");
        for (char c : value.toCharArray()) {
            switch (c) {
                case '"' -> out.append("\\\"");
                case '\\' -> out.append("\\\\");
                case '\n' -> out.append("\\n");
                case '\r' -> out.append("\\r");
                case '\t' -> out.append("\\t");
                default -> {
                    if (c < 0x20) {
                        out.append(String.format("\\u%04x", (int) c));
                    } else {
                        out.append(c);
                    }
                }
            }
        }
        return out.append('"').toString();
    }

    public void sendTestEmail(String recipient) {

        deliver(recipient, "TypeQuest Email Configuration Test", """
                Hello!

                This is a test email from TypeQuest.

                Your Spring Boot application is connected to the email service.

                We're one step closer to implementing secure password resets!

                Happy typing,
                TypeQuest Team
                """);
    }

    public void sendPasswordResetEmail(String recipient, String resetLink) {

        deliver(recipient, "Reset Your TypeQuest Password", """
        Hello TypeQuest player,

        We received a request to reset your password.

        Use the following link to choose a new password:

        %s

        This link expires in 15 minutes and can only be used once.

        If you did not request a password reset, you can ignore this email.

        Happy typing,
        TypeQuest Team
        """.formatted(resetLink));
    }

    public void sendVerificationEmail(String recipient, String link) {

        deliver(recipient, "Confirm your TypeQuest email", """
        Welcome to TypeQuest!

        Please confirm your email address with this link:

        %s

        The link works once and expires in 24 hours.

        If you did not create a TypeQuest account, you can ignore this email.

        Happy typing,
        TypeQuest Team
        """.formatted(link));
    }

    public void sendEmailChangeEmail(String recipient, String link) {

        deliver(recipient, "Confirm your new TypeQuest email", """
        Hello TypeQuest player,

        Someone asked to use this address for a TypeQuest account.
        Confirm the change with this link:

        %s

        The link works once and expires in 24 hours. Your account keeps its
        old address until you confirm.

        If this was not you, ignore this email and nothing changes.

        Happy typing,
        TypeQuest Team
        """.formatted(link));
    }
}
