export type RequisitionStatus = 
  | 'draft' 
  | 'pending' 
  | 'approved' 
  | 'rejected' 
  | 'interview' 
  | 'hold' 
  | 'offer'
  | 're-initiation-requested'
  | 're-initiation-rejected'
  | 'open'

export type OfferStatus = 
  | 'pending-approval' 
  | 'approved' 
  | 'rejected' 
  | 'offer-sent' 
  | 'accepted' 
  | 'declined'
  | 'no-show'
  | 'backed-out'
  | 'joining-date-revised'
  | 'joined'

export interface AuditLogEntry {
  id: string
  requisitionId: string
  previousStatus: RequisitionStatus | OfferStatus | null
  newStatus: RequisitionStatus | OfferStatus
  changedBy: {
    role: string
    name: string
  }
  changedAt: string
  notes?: string
  action: 
    | 'created' 
    | 'submitted' 
    | 'approved' 
    | 'rejected' 
    | 'updated' 
    | 'status_changed' 
    | 'interview_updated' 
    | 'routed_to_offer'
    | 'joining_date_pushed'
    | 'marked_no_show'
    | 'marked_backed_out'
    | 're_initiation_requested'
    | 're_initiation_approved'
    | 're_initiation_rejected'
    | 'requisition_reopened'
  metadata?: {
    oldJoiningDate?: string
    newJoiningDate?: string
    reason?: string
    backedOutReason?: string
    approverRole?: string
  }
}

export const createAuditEntry = (
  requisitionId: string,
  previousStatus: RequisitionStatus | OfferStatus | null,
  newStatus: RequisitionStatus | OfferStatus,
  changedBy: { role: string; name: string },
  action: AuditLogEntry['action'],
  notes?: string,
  metadata?: AuditLogEntry['metadata']
): AuditLogEntry => {
  return {
    id: `AUDIT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    requisitionId,
    previousStatus,
    newStatus,
    changedBy,
    changedAt: new Date().toISOString(),
    notes,
    action,
    metadata
  }
}

export const getActionLabel = (action: AuditLogEntry['action']): string => {
  switch (action) {
    case 'created':
      return 'Created'
    case 'submitted':
      return 'Submitted for Approval'
    case 'approved':
      return 'Approved'
    case 'rejected':
      return 'Rejected'
    case 'updated':
      return 'Updated'
    case 'status_changed':
      return 'Status Changed'
    case 'interview_updated':
      return 'Interview Updated'
    case 'routed_to_offer':
      return 'Routed to Offer'
    case 'joining_date_pushed':
      return 'Joining Date Revised'
    case 'marked_no_show':
      return 'Marked as No Show'
    case 'marked_backed_out':
      return 'Marked as Backed Out'
    case 're_initiation_requested':
      return 'Re-Initiation Requested'
    case 're_initiation_approved':
      return 'Re-Initiation Approved'
    case 're_initiation_rejected':
      return 'Re-Initiation Rejected'
    case 'requisition_reopened':
      return 'Requisition Reopened'
    default:
      return action
  }
}
