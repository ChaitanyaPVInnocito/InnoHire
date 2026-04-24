package com.innohire.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailNotificationService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public void sendInvite(String toEmail, String fullName, String role, String token) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("You're invited to join InnoHire!");
        message.setText("Hello " + fullName + ",\n\n" +
                "You have been invited to join InnoHire as a " + role + ".\n" +
                "Please use the following registration token to sign up: " + token + "\n\n" +
                "Best,\nThe InnoHire Team");
        mailSender.send(message);
    }

    public void sendNotificationEmail(String toEmail, String title, String body) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject(title);
        message.setText(body);
        mailSender.send(message);
    }
}
