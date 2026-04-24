import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { supabase } from '@/integrations/supabase/client'
import type { AuditLogEntry, RequisitionStatus, OfferStatus } from '@/types/audit'

interface AuditContextType {
  auditLogs: AuditLogEntry[]
  loading: boolean
  addAuditLog: (
    requisitionId: string,
    previousStatus: RequisitionStatus | OfferStatus | null,
    newStatus: RequisitionStatus | OfferStatus,
    changedBy: { role: string; name: string },
    action: AuditLogEntry['action'],
    notes?: string,
    metadata?: AuditLogEntry['metadata']
  ) => void
  getLogsForRequisition: (requisitionId: string) => AuditLogEntry[]
  clearLogs: () => void
}

const AuditContext = createContext<AuditContextType | undefined>(undefined)

function mapRow(row: any): AuditLogEntry {
  return {
    id: row.id,
    requisitionId: row.requisition_id,
    previousStatus: row.previous_status,
    newStatus: row.new_status,
    changedBy: { role: row.changed_by_role, name: row.changed_by_name },
    changedAt: row.changed_at,
    notes: row.notes,
    action: row.action,
    metadata: row.metadata as AuditLogEntry['metadata'],
  }
}

export function AuditProvider({ children }: { children: ReactNode }) {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('changed_at', { ascending: false })

      if (!error && data) {
        setAuditLogs(data.map(mapRow))
      }
      setLoading(false)
    }
    fetchLogs()
  }, [])

  const addAuditLog = useCallback(async (
    requisitionId: string,
    previousStatus: RequisitionStatus | OfferStatus | null,
    newStatus: RequisitionStatus | OfferStatus,
    changedBy: { role: string; name: string },
    action: AuditLogEntry['action'],
    notes?: string,
    metadata?: AuditLogEntry['metadata']
  ) => {
    const id = `AUDIT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const entry: AuditLogEntry = {
      id,
      requisitionId,
      previousStatus,
      newStatus,
      changedBy,
      changedAt: new Date().toISOString(),
      notes,
      action,
      metadata,
    }

    // Optimistic update
    setAuditLogs(prev => [entry, ...prev])

    const { error } = await supabase.from('audit_logs').insert({
      id,
      requisition_id: requisitionId,
      previous_status: previousStatus,
      new_status: newStatus,
      changed_by_role: changedBy.role,
      changed_by_name: changedBy.name,
      action,
      notes,
      metadata: metadata as any,
    })

    if (error) {
      console.error('Failed to insert audit log:', error)
    }
  }, [])

  const getLogsForRequisition = useCallback((requisitionId: string): AuditLogEntry[] => {
    return auditLogs
      .filter(log => log.requisitionId === requisitionId)
      .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())
  }, [auditLogs])

  const clearLogs = useCallback(async () => {
    setAuditLogs([])
    // Note: audit_logs table has deny-delete policy, so this is a no-op on DB
  }, [])

  return (
    <AuditContext.Provider value={{ auditLogs, loading, addAuditLog, getLogsForRequisition, clearLogs }}>
      {children}
    </AuditContext.Provider>
  )
}

export function useAudit() {
  const context = useContext(AuditContext)
  if (context === undefined) {
    throw new Error('useAudit must be used within an AuditProvider')
  }
  return context
}
