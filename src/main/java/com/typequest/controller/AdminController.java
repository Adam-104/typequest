package com.typequest.controller;

import com.typequest.dto.AdminDtos.*;
import com.typequest.model.Achievement;
import com.typequest.service.AdminService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Everything under /api/admin needs the ADMIN role (checked on the server,
// whatever the frontend shows).
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/test")
    public String testAdminAccess() {
        return "Welcome to the TypeQuest Admin Dashboard!";
    }

    @GetMapping("/stats")
    public Stats stats() {
        return adminService.stats();
    }

    // ---- Users ----

    @GetMapping("/users")
    public PageOf<UserRow> users(
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return adminService.users(q, page, size);
    }

    @PatchMapping("/users/{id}")
    public UserRow updateUser(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long id,
            @Valid @RequestBody UserUpdate update
    ) {
        return adminService.updateUser(Long.valueOf(jwt.getSubject()), id, update);
    }

    @PostMapping("/users/{id}/unlock")
    public UserRow unlock(@PathVariable Long id) {
        return adminService.unlockUser(id);
    }

    @PostMapping("/users/{id}/reset-xp")
    public UserRow resetXp(@PathVariable Long id) {
        return adminService.resetXp(id);
    }

    // ---- Game results ----

    @GetMapping("/games")
    public PageOf<GameRow> games(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return adminService.games(page, size);
    }

    @DeleteMapping("/games/{id}")
    public ResponseEntity<Void> deleteGame(@PathVariable Long id) {
        adminService.deleteGame(id);

        return ResponseEntity.noContent().build();
    }

    // ---- Achievements (edit only: unlocking is decided in code) ----

    @PutMapping("/achievements/{id}")
    public Achievement updateAchievement(
            @PathVariable Long id,
            @Valid @RequestBody AchievementUpdate update
    ) {
        return adminService.updateAchievement(id, update);
    }

    // ---- Typing passages ----

    @GetMapping("/passages")
    public List<PassageRow> passages() {
        return adminService.passages();
    }

    @PostMapping("/passages")
    public ResponseEntity<PassageRow> createPassage(@Valid @RequestBody PassageInput input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.createPassage(input));
    }

    @PutMapping("/passages/{id}")
    public PassageRow updatePassage(
            @PathVariable Long id,
            @Valid @RequestBody PassageInput input
    ) {
        return adminService.updatePassage(id, input);
    }

    @DeleteMapping("/passages/{id}")
    public ResponseEntity<Void> deletePassage(@PathVariable Long id) {
        adminService.deletePassage(id);

        return ResponseEntity.noContent().build();
    }

    @PostMapping("/passages/import")
    public ImportResult importPassages(@Valid @RequestBody PassageImport request) {
        return adminService.importPassages(request.passages());
    }
}
