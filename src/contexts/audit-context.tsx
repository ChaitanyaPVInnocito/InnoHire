import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { apiClient } from '@/api/client'
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

export function AuditProvider({ children }: { children: ReactNode }) {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await apiClient.get('/audit-logs')
        setAuditLogs(response.data || [])
      } catch (err) {
        console.error('Failed to fetch audit logs', err)
      } finally {
        setLoading(false)
      }
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
    const entry: AuditLogEntry & { alteredFields?: any } = {
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

    setAuditLogs(prev => [entry, ...prev])

    try {
      await apiClient.post('/audit-logs', {
        id,
        requisitionId,
        previousStatus,
        newStatus,
        changedByRole: changedBy.role,
        changedByName: changedBy.name,
        action,
        notes,
        metadata
      })
    } catch(err) {
      console.error('Failed to insert audit log:', err)
    }
  }, [])

  const getLogsForRequisition = useCallback((requisitionId: string): AuditLogEntry[] => {
    return auditLogs
      .filter(log => log.requisitionId === requisitionId)
      .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())
  }, [auditLogs])

  const clearLogs = useCallback(async () => {
    setAuditLogs([])
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
