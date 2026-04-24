package com.innohire.backend.service;

import com.innohire.backend.model.Profile;
import com.innohire.backend.repository.ProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final ProfileRepository profileRepository;

    public List<Profile> getAllProfiles() {
        return profileRepository.findAll();
    }

    public Profile getProfileById(String id) {
        return profileRepository.findById(id).orElseThrow(() -> new RuntimeException("Profile not found"));
    }

    public Profile updateProfile(String id, Profile profileDetails) {
        Profile profile = getProfileById(id);
        profile.setFullName(profileDetails.getFullName());
        profile.setDepartment(profileDetails.getDepartment());
        profile.setDefaultJobLocation(profileDetails.getDefaultJobLocation());
        profile.setDefaultExperienceRange(profileDetails.getDefaultExperienceRange());
        profile.setAvatarUrl(profileDetails.getAvatarUrl());
        return profileRepository.save(profile);
    }
}
