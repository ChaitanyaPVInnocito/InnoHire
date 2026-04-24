package com.innohire.backend.service;

import com.innohire.backend.model.Requisition;
import com.innohire.backend.repository.RequisitionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RequisitionService {

    private final RequisitionRepository requisitionRepository;

    public List<Requisition> getAllRequisitions() {
        return requisitionRepository.findAll();
    }

    public Requisition getRequisitionById(UUID id) {
        return requisitionRepository.findById(id).orElseThrow(() -> new RuntimeException("Requisition not found"));
    }

    public Requisition createRequisition(Requisition requisition) {
        return requisitionRepository.save(requisition);
    }

    public Requisition updateRequisition(UUID id, Requisition requisitionDetails) {
        Requisition req = getRequisitionById(id);
        req.setStatus(requisitionDetails.getStatus());
        req.setRole(requisitionDetails.getRole());
        req.setLevel(requisitionDetails.getLevel());
        req.setManager(requisitionDetails.getManager());
        req.setLob(requisitionDetails.getLob());
        req.setProject(requisitionDetails.getProject());
        req.setSalary(requisitionDetails.getSalary());
        req.setCandidates(requisitionDetails.getCandidates());
        req.setInterviewState(requisitionDetails.getInterviewState());
        return requisitionRepository.save(req);
    }

    public void deleteRequisition(UUID id) {
        requisitionRepository.deleteById(id);
    }
}
