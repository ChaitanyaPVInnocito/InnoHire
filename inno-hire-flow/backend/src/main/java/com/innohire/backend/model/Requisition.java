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
@Table(name = "requisitions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Requisition {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "role", nullable = false)
    private String role;

    @Column(name = "level", nullable = false)
    private String level;

    @Column(name = "manager", nullable = false)
    private String manager;

    @Column(name = "lob", nullable = false)
    private String lob;

    @Column(name = "project", nullable = false)
    private String project;

    @Column(name = "salary")
    private String salary;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "candidates")
    private Map<String, Object> candidates;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "interview_state")
    private Map<String, Object> interviewState;

    @Column(name = "created_date", nullable = false)
    private String createdDate;

    @Column(name = "created_by")
    private String createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
