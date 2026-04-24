import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
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

// Map DB row to frontend shape
function mapRow(row: any): Requisition {
  return {
    id: row.id,
    role: row.role,
    project: row.project,
    manager: row.manager,
    lob: row.lob,
    level: row.level,
    status: row.status as Requisition['status'],
    createdDate: row.created_date,
    salary: row.salary ?? '',
    interviewState: row.interview_state as InterviewTagState | undefined,
    candidates: (row.candidates as Candidate[]) ?? undefined,
  }
}

export function useRequisitions() {
  const [requisitions, setRequisitions] = useState<Requisition[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRequisitions = useCallback(async () => {
    const { data, error } = await supabase
      .from('requisitions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch requisitions:', error)
      return
    }
    setRequisitions((data ?? []).map(mapRow))
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchRequisitions()
  }, [fetchRequisitions])

  const addRequisition = useCallback(async (req: Requisition) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('requisitions').insert({
      id: req.id,
      role: req.role,
      project: req.project,
      manager: req.manager,
      lob: req.lob,
      level: req.level,
      status: req.status,
      created_date: req.createdDate,
      salary: req.salary,
      interview_state: req.interviewState as any,
      candidates: req.candidates as any,
      created_by: user?.id,
    })
    if (error) {
      console.error('Failed to add requisition:', error)
      return
    }
    // Optimistic update
    setRequisitions(prev => [req, ...prev])
  }, [])

  const updateRequisition = useCallback(async (id: string, updates: Partial<Requisition>) => {
    const dbUpdates: any = {}
    if (updates.role !== undefined) dbUpdates.role = updates.role
    if (updates.project !== undefined) dbUpdates.project = updates.project
    if (updates.manager !== undefined) dbUpdates.manager = updates.manager
    if (updates.lob !== undefined) dbUpdates.lob = updates.lob
    if (updates.level !== undefined) dbUpdates.level = updates.level
    if (updates.status !== undefined) dbUpdates.status = updates.status
    if (updates.salary !== undefined) dbUpdates.salary = updates.salary
    if (updates.interviewState !== undefined) dbUpdates.interview_state = updates.interviewState
    if (updates.candidates !== undefined) dbUpdates.candidates = updates.candidates

    const { error } = await supabase
      .from('requisitions')
      .update(dbUpdates)
      .eq('id', id)

    if (error) {
      console.error('Failed to update requisition:', error)
      return
    }
    // Optimistic update
    setRequisitions(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r))
  }, [])

  return { requisitions, loading, addRequisition, updateRequisition, refetch: fetchRequisitions }
}
