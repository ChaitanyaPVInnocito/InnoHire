import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { apiClient } from '@/api/client'
import type { ReInitiationRequest } from '@/components/dashboard/re-initiation-approval-dialog'

export interface PersistedOffer {
  id: string
  requisitionId: string
  candidateName: string
  role: string
  project: string
  proposedSalary: string
  requestedDate: string
  requestedBy: string
  status: 'pending-approval' | 'approved' | 'offer-sent' | 'accepted' | 'rejected' | 'no-show' | 'backed-out' | 'joining-date-revised' | 'joined'
  joiningDate?: string
  joinedDate?: string
  joiningDateHistory?: Array<{ oldDate: string; newDate: string; changedAt: string; remarks?: string }>
  backedOutReason?: string
  backedOutAt?: string
}

interface OffersContextType {
  offers: PersistedOffer[]
  loading: boolean
  reInitiationRequests: ReInitiationRequest[]
  addOffer: (offer: PersistedOffer) => void
  updateOffer: (id: string, updates: Partial<PersistedOffer>) => void
  getOfferById: (id: string) => PersistedOffer | undefined
  addReInitiationRequest: (request: ReInitiationRequest) => void
  updateReInitiationRequest: (id: string, updates: Partial<ReInitiationRequest>) => void
  getReInitiationRequestById: (id: string) => ReInitiationRequest | undefined
  getPendingReInitiationRequests: (forRole: 'hiring-manager' | 'lob-head') => ReInitiationRequest[]
}

const OffersContext = createContext<OffersContextType | undefined>(undefined)

export function OffersProvider({ children }: { children: ReactNode }) {
  const [offers, setOffers] = useState<PersistedOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [reInitiationRequests, setReInitiationRequests] = useState<ReInitiationRequest[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [offersRes, reInitRes] = await Promise.all([
          apiClient.get('/offers'),
          apiClient.get('/re-initiation-requests')
        ])
        setOffers(offersRes.data || [])
        setReInitiationRequests(reInitRes.data || [])
      } catch (err) {
        console.error("Failed to fetch offers context", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const addOffer = useCallback(async (offer: PersistedOffer) => {
    setOffers(prev => [offer, ...prev])
    try {
      await apiClient.post('/offers', offer)
    } catch(err) {
      console.error('Failed to insert offer:', err)
    }
  }, [])

  const updateOffer = useCallback(async (id: string, updates: Partial<PersistedOffer>) => {
    setOffers(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o))
    try {
      await apiClient.put(`/offers/${id}`, updates)
    } catch(err) {
      console.error('Failed to update offer:', err)
    }
  }, [])

  const getOfferById = useCallback((id: string) => {
    return offers.find(o => o.id === id)
  }, [offers])

  const addReInitiationRequest = useCallback(async (request: ReInitiationRequest) => {
    setReInitiationRequests(prev => [request, ...prev])
    try {
      await apiClient.post('/re-initiation-requests', request)
    } catch(err) {
      console.error('Failed to insert re-initiation request:', err)
    }
  }, [])

  const updateReInitiationRequest = useCallback(async (id: string, updates: Partial<ReInitiationRequest>) => {
    setReInitiationRequests(prev => prev.map(req =>
      req.id === id ? { ...req, ...updates } : req
    ))
    try {
      await apiClient.put(`/re-initiation-requests/${id}`, updates)
    } catch(err) {
      console.error('Failed to update re-initiation request:', err)
    }
  }, [])

  const getReInitiationRequestById = useCallback((id: string) => {
    return reInitiationRequests.find(req => req.id === id)
  }, [reInitiationRequests])

  const getPendingReInitiationRequests = useCallback((forRole: 'hiring-manager' | 'lob-head') => {
    if (forRole === 'hiring-manager') return reInitiationRequests.filter(req => req.status === 'pending-hm')
    if (forRole === 'lob-head') return reInitiationRequests.filter(req => req.status === 'pending-lob')
    return []
  }, [reInitiationRequests])

  return (
    <OffersContext.Provider value={{
      offers, loading, reInitiationRequests, addOffer, updateOffer, getOfferById,
      addReInitiationRequest, updateReInitiationRequest, getReInitiationRequestById, getPendingReInitiationRequests,
    }}>
      {children}
    </OffersContext.Provider>
  )
}

export function useOffers() {
  const context = useContext(OffersContext)
  if (!context) throw new Error('useOffers must be used within an OffersProvider')
  return context
}
