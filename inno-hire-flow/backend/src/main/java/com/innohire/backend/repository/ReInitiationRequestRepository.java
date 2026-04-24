package com.innohire.backend.repository;

import com.innohire.backend.model.ReInitiationRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ReInitiationRequestRepository extends JpaRepository<ReInitiationRequest, UUID> {
}
