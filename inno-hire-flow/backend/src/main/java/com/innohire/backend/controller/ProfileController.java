package com.innohire.backend.controller;

import com.innohire.backend.model.Profile;
import com.innohire.backend.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/profiles")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping
    public ResponseEntity<List<Profile>> getAllProfiles() {
        return ResponseEntity.ok(profileService.getAllProfiles());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Profile> getProfileById(@PathVariable String id) {
        return ResponseEntity.ok(profileService.getProfileById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Profile> updateProfile(@PathVariable String id, @RequestBody Profile profile) {
        return ResponseEntity.ok(profileService.updateProfile(id, profile));
    }

    @PutMapping("/{id}/avatar")
    public ResponseEntity<Profile> updateAvatar(@PathVariable String id, @RequestBody java.util.Map<String, String> body) {
        Profile profile = profileService.getProfileById(id);
        profile.setAvatarUrl(body.get("avatar_url"));
        // We bypass service logic here for direct repository save in this fast mock migration 
        // but normally this would be in ProfileService.updateAvatar()
        return ResponseEntity.ok(profileService.updateProfile(id, profile));
    }
}
