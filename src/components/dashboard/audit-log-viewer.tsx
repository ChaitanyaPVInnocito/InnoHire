import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { useAudit } from "@/contexts/audit-context"
import { getActionLabel } from "@/types/audit"
import { 
  FileEdit, 
  Send, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users,
  ArrowRight
} from "lucide-react"
import { cn } from "@/lib/utils"

interface AuditLogViewerProps {
  requisitionId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const getActionIcon = (action: string) => {
  switch (action) {
    case 'created':
      return FileEdit
    case 'submitted':
      return Send
    case 'approved':
      return CheckCircle
    case 'rejected':
      return XCircle
    case 'status_changed':
      return Users
    default:
      return Clock
  }
}

const getActionColor = (action: string) => {
  switch (action) {
    case 'approved':
      return 'text-success bg-success/10'
    case 'rejected':
      return 'text-destructive bg-destructive/10'
    case 'submitted':
      return 'text-primary bg-primary/10'
    default:
      return 'text-muted-foreground bg-muted'
  }
}

const getStatusBadgeVariant = (status: string | null) => {
  switch (status) {
    case 'draft':
      return 'secondary'
    case 'pending':
      return 'outline'
    case 'approved':
      return 'default'
    case 'rejected':
      return 'destructive'
    case 'interview':
      return 'default'
    case 'hold':
      return 'outline'
    default:
      return 'secondary'
  }
}

export function AuditLogViewer({ requisitionId, open, onOpenChange }: AuditLogViewerProps) {
  const { getLogsForRequisition } = useAudit()
  
  const logs = requisitionId ? getLogsForRequisition(requisitionId) : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Audit History</DialogTitle>
          <DialogDescription>
            View the complete status change history for {requisitionId || 'this requisition'}.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[400px] pr-4">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <Clock className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">No audit history available</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Status changes will be recorded here
              </p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-border" />
              
              <div className="space-y-4">
                {logs.map((log, index) => {
                  const Icon = getActionIcon(log.action)
                  const colorClass = getActionColor(log.action)
                  
                  return (
                    <div key={log.id} className="relative pl-10">
                      {/* Timeline dot */}
                      <div 
                        className={cn(
                          "absolute left-0 top-1 flex items-center justify-center w-8 h-8 rounded-full",
                          colorClass
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      
                      <div className="bg-card border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">
                            {getActionLabel(log.action)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(log.changedAt), "MMM d, yyyy 'at' h:mm a")}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          {log.previousStatus && (
                            <>
                              <Badge variant={getStatusBadgeVariant(log.previousStatus) as any}>
                                {log.previousStatus}
                              </Badge>
                              <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            </>
                          )}
                          <Badge variant={getStatusBadgeVariant(log.newStatus) as any}>
                            {log.newStatus}
                          </Badge>
                        </div>
                        
                        <div className="mt-2 text-xs text-muted-foreground">
                          By {log.changedBy.name} ({log.changedBy.role})
                        </div>
                        
                        {log.notes && (
                          <div className="mt-2 text-sm bg-muted/50 rounded p-2">
                            <span className="text-muted-foreground">Notes: </span>
                            {log.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
