package com.innohire.backend.service;

import com.innohire.backend.model.Offer;
import com.innohire.backend.repository.OfferRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OfferService {

    private final OfferRepository offerRepository;

    public List<Offer> getAllOffers() {
        return offerRepository.findAll();
    }

    public Offer getOfferById(UUID id) {
        return offerRepository.findById(id).orElseThrow(() -> new RuntimeException("Offer not found"));
    }

    public Offer createOffer(Offer offer) {
        return offerRepository.save(offer);
    }

    public Offer updateOffer(UUID id, Offer offerDetails) {
        Offer offer = getOfferById(id);
        offer.setStatus(offerDetails.getStatus());
        offer.setProposedSalary(offerDetails.getProposedSalary());
        offer.setJoiningDate(offerDetails.getJoiningDate());
        offer.setJoinedDate(offerDetails.getJoinedDate());
        offer.setBackedOutAt(offerDetails.getBackedOutAt());
        offer.setBackedOutReason(offerDetails.getBackedOutReason());
        offer.setJoiningDateHistory(offerDetails.getJoiningDateHistory());
        return offerRepository.save(offer);
    }

    public void deleteOffer(UUID id) {
        offerRepository.deleteById(id);
    }
}
