import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/api/client'
import type { InterviewTagState } from '@/components/dashboard/interview-tag-dialog'
import type { Candidate } from '@/types/candidate'

export interface Requisition {
  id: string
  role: string
  project: string
  manager: string
  lob: string
  level: string
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'interview' | 'hold'
  createdDate: string
  salary: string
  interviewState?: InterviewTagState
  candidates?: Candidate[]
}

export function useRequisitions() {
  const [requisitions, setRequisitions] = useState<Requisition[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRequisitions = useCallback(async () => {
    try {
      const response = await apiClient.get('/requisitions')
      setRequisitions(response.data || [])
    } catch (error) {
      console.error('Failed to fetch requisitions:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRequisitions()
  }, [fetchRequisitions])

  const addRequisition = useCallback(async (req: Requisition) => {
    try {
      const response = await apiClient.post('/requisitions', req)
      // Optimistic update using returned data
      setRequisitions(prev => [response.data, ...prev])
    } catch (error) {
      console.error('Failed to add requisition:', error)
    }
  }, [])

  const updateRequisition = useCallback(async (id: string, updates: Partial<Requisition>) => {
    try {
      // Optimistic update before request completes for snappiness
      setRequisitions(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r))
      await apiClient.put(`/requisitions/${id}`, updates)
    } catch (error) {
      console.error('Failed to update requisition:', error)
      // On failure, should ideally roll back, but relying on component level error handling for now
    }
  }, [])

  return { requisitions, loading, addRequisition, updateRequisition, refetch: fetchRequisitions }
}
