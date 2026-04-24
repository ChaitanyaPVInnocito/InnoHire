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
@Table(name = "offers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Offer {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "requisition_id", nullable = false)
    private String requisitionId;

    @Column(name = "candidate_name", nullable = false)
    private String candidateName;

    @Column(name = "proposed_salary", nullable = false)
    private String proposedSalary;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "project", nullable = false)
    private String project;

    @Column(name = "role", nullable = false)
    private String role;

    @Column(name = "requested_by", nullable = false)
    private String requestedBy;

    @Column(name = "requested_date", nullable = false)
    private String requestedDate;

    @Column(name = "joining_date")
    private String joiningDate;

    @Column(name = "joined_date")
    private String joinedDate;

    @Column(name = "backed_out_at")
    private String backedOutAt;

    @Column(name = "backed_out_reason")
    private String backedOutReason;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "joining_date_history")
    private Map<String, Object> joiningDateHistory;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
