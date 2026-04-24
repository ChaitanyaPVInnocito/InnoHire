package com.innohire.backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "notification_preferences")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "browser_enabled", nullable = false)
    private boolean browserEnabled = false;

    @Column(name = "email_enabled", nullable = false)
    private boolean emailEnabled = false;

    @Column(name = "offer_approved", nullable = false)
    private boolean offerApproved = false;

    @Column(name = "offer_rejected", nullable = false)
    private boolean offerRejected = false;

    @Column(name = "offer_routed", nullable = false)
    private boolean offerRouted = false;

    @Column(name = "re_initiation", nullable = false)
    private boolean reInitiation = false;

    @Column(name = "requisition_approved", nullable = false)
    private boolean requisitionApproved = false;

    @Column(name = "requisition_rejected", nullable = false)
    private boolean requisitionRejected = false;

    @Column(name = "requisition_submitted", nullable = false)
    private boolean requisitionSubmitted = false;

    @Column(name = "requisition_update", nullable = false)
    private boolean requisitionUpdate = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
