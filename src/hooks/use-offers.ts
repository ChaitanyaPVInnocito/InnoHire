import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import type { OfferRequest } from '@/components/dashboard/offer-approval-table'

// Map DB offer row to OfferRequest shape used by the approval table
function mapRow(row: any): OfferRequest {
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
    remarks: undefined,
    comments: undefined,
    attachments: undefined,
  }
}

export function useOffers() {
  const [offerRequests, setOfferRequests] = useState<OfferRequest[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOffers = useCallback(async () => {
    const { data, error } = await supabase
      .from('offers')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setOfferRequests(data.map(mapRow))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchOffers()
  }, [])

  const addOfferRequest = useCallback(async (offer: OfferRequest) => {
    setOfferRequests(prev => [offer, ...prev])

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
    })

    if (error) console.error('Failed to insert offer request:', error)
  }, [])

  const updateOfferRequest = useCallback(async (id: string, updates: Partial<OfferRequest>) => {
    setOfferRequests(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o))

    const dbUpdates: any = {}
    if (updates.status !== undefined) dbUpdates.status = updates.status
    if (updates.joiningDate !== undefined) dbUpdates.joining_date = updates.joiningDate

    if (Object.keys(dbUpdates).length > 0) {
      const { error } = await supabase.from('offers').update(dbUpdates).eq('id', id)
      if (error) console.error('Failed to update offer request:', error)
    }
  }, [])

  return { offerRequests, loading, addOfferRequest, updateOfferRequest, refetch: fetchOffers }
}
