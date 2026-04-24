import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/api/client'
import type { OfferRequest } from '@/components/dashboard/offer-approval-table'

export function useOffers() {
  const [offerRequests, setOfferRequests] = useState<OfferRequest[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOffers = useCallback(async () => {
    try {
      const response = await apiClient.get('/offers')
      setOfferRequests(response.data || [])
    } catch (error) {
       console.error('Failed to fetch offers:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOffers()
  }, [])

  const addOfferRequest = useCallback(async (offer: OfferRequest) => {
    try {
      const response = await apiClient.post('/offers', offer)
      setOfferRequests(prev => [response.data, ...prev])
    } catch (error) {
      console.error('Failed to insert offer request:', error)
    }
  }, [])

  const updateOfferRequest = useCallback(async (id: string, updates: Partial<OfferRequest>) => {
    try {
      setOfferRequests(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o))
      await apiClient.put(`/offers/${id}`, updates)
    } catch (error) {
      console.error('Failed to update offer request:', error)
    }
  }, [])

  return { offerRequests, loading, addOfferRequest, updateOfferRequest, refetch: fetchOffers }
}
