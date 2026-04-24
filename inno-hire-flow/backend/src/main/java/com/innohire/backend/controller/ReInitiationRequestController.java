package com.innohire.backend.controller;

import com.innohire.backend.model.ReInitiationRequest;
import com.innohire.backend.repository.ReInitiationRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/re-initiation-requests")
@RequiredArgsConstructor
public class ReInitiationRequestController {

    private final ReInitiationRequestRepository repository;

    @GetMapping
    public ResponseEntity<List<ReInitiationRequest>> getAll() {
        return ResponseEntity.ok(repository.findAll());
    }

    @PostMapping
    public ResponseEntity<ReInitiationRequest> create(@RequestBody ReInitiationRequest request) {
        return ResponseEntity.ok(repository.save(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ReInitiationRequest> update(
            @PathVariable UUID id,
            @RequestBody ReInitiationRequest requestDetails) {
        return repository.findById(id).map(existing -> {
            existing.setStatus(requestDetails.getStatus());
            existing.setRemarks(requestDetails.getRemarks());
            existing.setReviewedBy(requestDetails.getReviewedBy());
            existing.setReviewedAt(requestDetails.getReviewedAt());
            return ResponseEntity.ok(repository.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }
}
