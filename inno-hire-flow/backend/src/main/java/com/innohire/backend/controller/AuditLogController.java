package com.innohire.backend.controller;

import com.innohire.backend.model.AuditLog;
import com.innohire.backend.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogRepository auditLogRepository;

    @GetMapping
    public ResponseEntity<List<AuditLog>> getAllLogs() {
        return ResponseEntity.ok(auditLogRepository.findAll());
    }

    @GetMapping("/requisition/{requisitionId}")
    public ResponseEntity<List<AuditLog>> getLogsByRequisition(@PathVariable UUID requisitionId) {
        return ResponseEntity.ok(auditLogRepository.findByRequisitionIdOrderByCreatedAtDesc(requisitionId));
    }

    @GetMapping("/offer/{offerId}")
    public ResponseEntity<List<AuditLog>> getLogsByOffer(@PathVariable UUID offerId) {
        return ResponseEntity.ok(auditLogRepository.findByOfferIdOrderByCreatedAtDesc(offerId));
    }

    @PostMapping
    public ResponseEntity<AuditLog> createLog(@RequestBody AuditLog log) {
        return ResponseEntity.ok(auditLogRepository.save(log));
    }
}
