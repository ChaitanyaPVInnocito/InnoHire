package com.innohire.backend.service;

import com.innohire.backend.model.Invitation;
import com.innohire.backend.repository.InvitationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InvitationService {

    private final InvitationRepository invitationRepository;
    private final EmailNotificationService emailNotificationService;

    public List<Invitation> getAllInvitations() {
        return invitationRepository.findAll();
    }

    public Invitation createInvitation(Invitation invitation) {
        Invitation saved = invitationRepository.save(invitation);
        
        emailNotificationService.sendInvite(
                saved.getEmail(),
                saved.getFullName(),
                saved.getRole().getValue(),
                saved.getToken()
        );
        
        return saved;
    }

    public void deleteInvitation(UUID id) {
        invitationRepository.deleteById(id);
    }
}
