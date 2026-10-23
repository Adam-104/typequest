package com.typequest.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final String fromEmail;

    public EmailService(
            JavaMailSender mailSender,
            @Value("${typequest.mail.from}") String fromEmail) {

        this.mailSender = mailSender;
        this.fromEmail = fromEmail;
    }

    public void sendTestEmail(String recipient) {

        SimpleMailMessage message = new SimpleMailMessage();

        message.setFrom(fromEmail);
        message.setTo(recipient);
        message.setSubject("TypeQuest Email Configuration Test");
        message.setText("""
                Hello!

                This is a test email from TypeQuest.

                Your Spring Boot application is connected to the email service.

                We're one step closer to implementing secure password resets!

                Happy typing,
                TypeQuest Team
                """);

        mailSender.send(message);
    }

    public void sendPasswordResetEmail(String recipient, String resetLink) {

        SimpleMailMessage message = new SimpleMailMessage();

        message.setFrom(fromEmail);
        message.setTo(recipient);
        message.setSubject("Reset Your TypeQuest Password");

        message.setText("""
        Hello TypeQuest player,

        We received a request to reset your password.

        Use the following link to choose a new password:

        %s

        This link expires in 15 minutes and can only be used once.

        If you did not request a password reset, you can ignore this email.

        Happy typing,
        TypeQuest Team
        """.formatted(resetLink));

        mailSender.send(message);
    }
}