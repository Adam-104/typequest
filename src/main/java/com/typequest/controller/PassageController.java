package com.typequest.controller;

import com.typequest.service.AdminService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Locale;

// Texts for the Typing Speed (SPEED) and Typing Racer (RACE) games.
// An empty list means "use the built-in texts".
@RestController
@RequestMapping("/api/passages")
public class PassageController {

    private final AdminService adminService;

    public PassageController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping
    public List<String> passages(@RequestParam String category) {
        String normalized = category.trim().toUpperCase(Locale.ROOT);

        if (!normalized.equals("SPEED") && !normalized.equals("RACE")) {
            throw new IllegalArgumentException("Category must be SPEED or RACE.");
        }

        return adminService.activePassageTexts(normalized);
    }
}
