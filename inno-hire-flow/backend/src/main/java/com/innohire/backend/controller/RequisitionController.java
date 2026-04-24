package com.innohire.backend.controller;

import com.innohire.backend.model.Requisition;
import com.innohire.backend.service.RequisitionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/requisitions")
@RequiredArgsConstructor
public class RequisitionController {

    private final RequisitionService requisitionService;

    @GetMapping
    public ResponseEntity<List<Requisition>> getAllRequisitions() {
        return ResponseEntity.ok(requisitionService.getAllRequisitions());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Requisition> getRequisitionById(@PathVariable UUID id) {
        return ResponseEntity.ok(requisitionService.getRequisitionById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('lob-head', 'hiring-manager')")
    public ResponseEntity<Requisition> createRequisition(@RequestBody Requisition requisition) {
        return ResponseEntity.ok(requisitionService.createRequisition(requisition));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Requisition> updateRequisition(@PathVariable UUID id, @RequestBody Requisition requisition) {
        return ResponseEntity.ok(requisitionService.updateRequisition(id, requisition));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRequisition(@PathVariable UUID id) {
        requisitionService.deleteRequisition(id);
        return ResponseEntity.noContent().build();
    }
}
