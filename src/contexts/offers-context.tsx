import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { supabase } from '@/integrations/supabase/client'
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

function mapRow(row: any): PersistedOffer {
  return {
    id: row.id,
    requisitionId: row.requisition_id,
    candidateName: row.candidate_name,
    role: row.role,
    project: row.project,
    proposedSalary: row.proposed_salary,
    requestedDate: row.requested_date,
    requestedBy: row.requested_by,
    status: row.status,
    joiningDate: row.joining_date ?? undefined,
    joinedDate: row.joined_date ?? undefined,
    joiningDateHistory: (row.joining_date_history as any[]) ?? undefined,
    backedOutReason: row.backed_out_reason ?? undefined,
    backedOutAt: row.backed_out_at ?? undefined,
  }
}

function mapReInitRow(row: any): ReInitiationRequest {
  return {
    id: row.id,
    requisitionId: row.requisition_id,
    role: row.role,
    project: row.project,
    originalCandidateName: row.original_candidate_name,
    backedOutReason: row.backed_out_reason,
    requestedBy: row.requested_by,
    requestedDate: row.requested_date,
    status: row.status,
    hmApproval: row.hm_approval ?? undefined,
    lobApproval: row.lob_approval ?? undefined,
  }
}

export function OffersProvider({ children }: { children: ReactNode }) {
  const [offers, setOffers] = useState<PersistedOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [reInitiationRequests, setReInitiationRequests] = useState<ReInitiationRequest[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const [offersRes, reInitRes] = await Promise.all([
        supabase.from('offers').select('*').order('created_at', { ascending: false }),
        supabase.from('re_initiation_requests').select('*').order('created_at', { ascending: false }),
      ])

      if (!offersRes.error && offersRes.data) {
        setOffers(offersRes.data.map(mapRow))
      }
      if (!reInitRes.error && reInitRes.data) {
        setReInitiationRequests(reInitRes.data.map(mapReInitRow))
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  const addOffer = useCallback(async (offer: PersistedOffer) => {
    setOffers(prev => [offer, ...prev])

    const { error } = await supabase.from('offers').insert({
      id: offer.id,
      requisition_id: offer.requisitionId,
      candidate_name: offer.candidateName,
      role: offer.role,
      project: offer.project,
      proposed_salary: offer.proposedSalary,
      requested_date: offer.requestedDate,
      requested_by: offer.requestedBy,
      status: offer.status,
      joining_date: offer.joiningDate ?? null,
      joined_date: offer.joinedDate ?? null,
      joining_date_history: (offer.joiningDateHistory as any) ?? [],
      backed_out_reason: offer.backedOutReason ?? null,
      backed_out_at: offer.backedOutAt ?? null,
    })

    if (error) console.error('Failed to insert offer:', error)
  }, [])

  const updateOffer = useCallback(async (id: string, updates: Partial<PersistedOffer>) => {
    setOffers(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o))

    const dbUpdates: any = {}
    if (updates.status !== undefined) dbUpdates.status = updates.status
    if (updates.joiningDate !== undefined) dbUpdates.joining_date = updates.joiningDate
    if (updates.joinedDate !== undefined) dbUpdates.joined_date = updates.joinedDate
    if (updates.joiningDateHistory !== undefined) dbUpdates.joining_date_history = updates.joiningDateHistory
    if (updates.backedOutReason !== undefined) dbUpdates.backed_out_reason = updates.backedOutReason
    if (updates.backedOutAt !== undefined) dbUpdates.backed_out_at = updates.backedOutAt
    if (updates.candidateName !== undefined) dbUpdates.candidate_name = updates.candidateName
    if (updates.proposedSalary !== undefined) dbUpdates.proposed_salary = updates.proposedSalary

    if (Object.keys(dbUpdates).length > 0) {
      const { error } = await supabase.from('offers').update(dbUpdates).eq('id', id)
      if (error) console.error('Failed to update offer:', error)
    }
  }, [])

  const getOfferById = useCallback((id: string) => {
    return offers.find(o => o.id === id)
  }, [offers])

  const addReInitiationRequest = useCallback(async (request: ReInitiationRequest) => {
    setReInitiationRequests(prev => [request, ...prev])

    const { error } = await supabase.from('re_initiation_requests').insert({
      id: request.id,
      requisition_id: request.requisitionId,
      role: request.role,
      project: request.project,
      original_candidate_name: request.originalCandidateName,
      backed_out_reason: request.backedOutReason,
      requested_by: request.requestedBy,
      requested_date: request.requestedDate,
      status: request.status,
      hm_approval: request.hmApproval as any ?? null,
      lob_approval: request.lobApproval as any ?? null,
    })

    if (error) console.error('Failed to insert re-initiation request:', error)
  }, [])

  const updateReInitiationRequest = useCallback(async (id: string, updates: Partial<ReInitiationRequest>) => {
    setReInitiationRequests(prev => prev.map(req =>
      req.id === id ? { ...req, ...updates } : req
    ))

    const dbUpdates: any = {}
    if (updates.status !== undefined) dbUpdates.status = updates.status
    if (updates.hmApproval !== undefined) dbUpdates.hm_approval = updates.hmApproval
    if (updates.lobApproval !== undefined) dbUpdates.lob_approval = updates.lobApproval

    if (Object.keys(dbUpdates).length > 0) {
      const { error } = await supabase.from('re_initiation_requests').update(dbUpdates).eq('id', id)
      if (error) console.error('Failed to update re-initiation request:', error)
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
