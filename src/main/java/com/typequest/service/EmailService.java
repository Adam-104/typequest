package com.typequest.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
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

    // Single exit for every message. Each message has an HTML version (what
    // people see) and a plain-text version (for clients that cannot show HTML).
    // Failures are always MailException so the callers' existing handling keeps working.
    private void deliver(String recipient, EmailTemplates.Message message) {
        if (brevoApiKey.isEmpty()) {
            try {
                MimeMessage mime = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(mime, true, "UTF-8");

                helper.setFrom(fromEmail);
                helper.setTo(recipient);
                helper.setSubject(message.subject());
                helper.setText(message.text(), message.html());

                mailSender.send(mime);
            } catch (MessagingException exception) {
                throw new MailSendException("Could not build the email: " + exception.getMessage(), exception);
            }

            return;
        }

        String json = "{\"sender\":{\"name\":\"TypeQuest\",\"email\":" + quote(fromEmail) + "},"
                + "\"to\":[{\"email\":" + quote(recipient) + "}],"
                + "\"subject\":" + quote(message.subject()) + ","
                + "\"htmlContent\":" + quote(message.html()) + ","
                + "\"textContent\":" + quote(message.text()) + "}";

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
        deliver(recipient, EmailTemplates.test());
    }

    public void sendPasswordResetEmail(String recipient, String resetLink) {
        deliver(recipient, EmailTemplates.resetPassword(resetLink));
    }

    public void sendVerificationEmail(String recipient, String link) {
        deliver(recipient, EmailTemplates.verifyEmail(link));
    }

    public void sendEmailChangeEmail(String recipient, String link) {
        deliver(recipient, EmailTemplates.confirmNewEmail(link));
    }
}
