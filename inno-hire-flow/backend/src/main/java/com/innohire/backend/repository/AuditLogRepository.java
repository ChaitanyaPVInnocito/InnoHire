package com.innohire.backend.repository;

import com.innohire.backend.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
    List<AuditLog> findByRequisitionIdOrderByCreatedAtDesc(UUID requisitionId);
    List<AuditLog> findByOfferIdOrderByCreatedAtDesc(UUID offerId);
}
