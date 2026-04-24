package com.innohire.backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "re_initiation_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReInitiationRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "requisition_id", nullable = false)
    private String requisitionId;

    @Column(name = "role", nullable = false)
    private String role;

    @Column(name = "project", nullable = false)
    private String project;

    @Column(name = "original_candidate_name", nullable = false)
    private String originalCandidateName;

    @Column(name = "backed_out_reason", nullable = false)
    private String backedOutReason;

    @Column(name = "requested_by", nullable = false)
    private String requestedBy;

    @Column(name = "requested_by_user_id")
    private String requestedByUserId;

    @Column(name = "status", nullable = false)
    private String status;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "lob_approval")
    private Map<String, Object> lobApproval;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "hm_approval")
    private Map<String, Object> hmApproval;

    @Column(name = "requested_date", nullable = false)
    private String requestedDate;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
