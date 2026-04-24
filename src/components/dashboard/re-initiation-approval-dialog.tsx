import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, RotateCcw, AlertTriangle } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { UserRole } from "@/components/dashboard/navigation"

export interface ReInitiationRequest {
  id: string
  requisitionId: string
  role: string
  project: string
  originalCandidateName: string
  backedOutReason: string
  requestedBy: string
  requestedDate: string
  status: 'pending-hm' | 'pending-lob' | 'approved' | 'rejected'
  hmApproval?: { approved: boolean; date: string; comments?: string }
  lobApproval?: { approved: boolean; date: string; comments?: string }
}

interface ReInitiationApprovalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  request: ReInitiationRequest | null
  userRole: UserRole
  onApprove: (requestId: string, comments?: string) => void
  onReject: (requestId: string, reason: string) => void
}

export function ReInitiationApprovalDialog({
  open,
  onOpenChange,
  request,
  userRole,
  onApprove,
  onReject
}: ReInitiationApprovalDialogProps) {
  const [comments, setComments] = useState("")
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectReason, setRejectReason] = useState("")

  const resetForm = () => {
    setComments("")
    setShowRejectForm(false)
    setRejectReason("")
  }

  const handleClose = () => {
    resetForm()
    onOpenChange(false)
  }

  const handleApprove = () => {
    if (!request) return
    
    onApprove(request.id, comments || undefined)
    
    const nextStep = userRole === 'hiring-manager' 
      ? 'Request forwarded to LOB Head for approval.'
      : 'Requisition is now open for hiring.'
    
    toast({
      title: "Re-Initiation Approved",
      description: nextStep,
    })
    
    handleClose()
  }

  const handleReject = () => {
    if (!request || !rejectReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for rejection.",
        variant: "destructive"
      })
      return
    }
    
    onReject(request.id, rejectReason)
    
    toast({
      title: "Re-Initiation Rejected",
      description: "The requisition will remain closed.",
    })
    
    handleClose()
  }

  const canApprove = () => {
    if (!request) return false
    if (userRole === 'hiring-manager' && request.status === 'pending-hm') return true
    if (userRole === 'lob-head' && request.status === 'pending-lob') return true
    return false
  }

  const getStatusBadge = () => {
    if (!request) return null
    
    switch (request.status) {
      case 'pending-hm':
        return <Badge className="bg-warning-muted text-warning-foreground border-warning/40">Awaiting Hiring Manager</Badge>
      case 'pending-lob':
        return <Badge className="bg-info-muted text-info-foreground border-info/40">Awaiting LOB Head</Badge>
      case 'approved':
        return <Badge className="bg-success-muted text-success-foreground border-success/40">Approved</Badge>
      case 'rejected':
        return <Badge className="bg-danger-muted text-danger-foreground border-danger/40">Rejected</Badge>
    }
  }

  if (!request) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-primary" />
            Re-Initiation Approval
          </DialogTitle>
          <DialogDescription>
            Review the re-initiation request for requisition {request.requisitionId}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-muted-foreground">Requisition ID</Label>
              <p className="font-medium text-primary">{request.requisitionId}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Role</Label>
              <p className="font-medium">{request.role}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Project</Label>
              <p className="font-medium">{request.project}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Status</Label>
              <div className="mt-1">{getStatusBadge()}</div>
            </div>
          </div>

          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-destructive">Previous Candidate Backed Out</p>
                <p className="text-muted-foreground">
                  {request.originalCandidateName} - {request.backedOutReason}
                </p>
              </div>
            </div>
          </div>

          {request.hmApproval && (
            <div className="p-3 bg-muted rounded-md text-sm">
              <div className="flex items-center gap-2">
                {request.hmApproval.approved ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
                <span className="font-medium">
                  Hiring Manager: {request.hmApproval.approved ? 'Approved' : 'Rejected'}
                </span>
              </div>
              {request.hmApproval.comments && (
                <p className="text-muted-foreground mt-1 ml-6">{request.hmApproval.comments}</p>
              )}
            </div>
          )}

          {canApprove() && !showRejectForm && (
            <div className="space-y-2">
              <Label htmlFor="comments">Comments (Optional)</Label>
              <Textarea
                id="comments"
                placeholder="Add any notes or conditions..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={2}
              />
            </div>
          )}

          {showRejectForm && (
            <div className="space-y-2">
              <Label htmlFor="rejectReason">Reason for Rejection *</Label>
              <Textarea
                id="rejectReason"
                placeholder="Please provide a reason..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={2}
              />
            </div>
          )}
        </div>

        {canApprove() && (
          <DialogFooter className="gap-2">
            {!showRejectForm ? (
              <>
                <Button variant="outline" onClick={() => setShowRejectForm(true)}>
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
                <Button onClick={handleApprove} className="bg-success hover:bg-success/90">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setShowRejectForm(false)}>
                  Back
                </Button>
                <Button variant="destructive" onClick={handleReject}>
                  Confirm Rejection
                </Button>
              </>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
