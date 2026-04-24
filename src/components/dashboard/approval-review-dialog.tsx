import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { CheckCircle, XCircle, Bell } from "lucide-react"

interface Requisition {
  id: string
  role: string
  project: string
  manager?: string
  lob: string
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'interview' | 'hold'
  createdDate: string
  salary: string
}

interface ApprovalReviewDialogProps {
  requisition: Requisition | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onApprove: (id: string, salaryMax: string, comments?: string) => void
  onReject: (id: string, reason: string) => void
}

export function ApprovalReviewDialog({ 
  requisition, 
  open, 
  onOpenChange, 
  onApprove, 
  onReject 
}: ApprovalReviewDialogProps) {
  const [salaryMax, setSalaryMax] = useState("")
  const [reviewComments, setReviewComments] = useState("")
  const [rejectReason, setRejectReason] = useState("")
  const [showRejectForm, setShowRejectForm] = useState(false)

  const handleApprove = () => {
    if (!salaryMax.trim()) {
      toast.error("Please enter the Salary Range (Max)")
      return
    }
    if (requisition) {
      onApprove(requisition.id, salaryMax, reviewComments || undefined)
      
      // Enhanced approval notification
      toast.success(
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-success mt-0.5" />
          <div>
            <p className="font-semibold">Requisition Approved</p>
            <p className="text-sm text-muted-foreground">
              {requisition.id} - {requisition.role}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Notification sent to {requisition.manager}
            </p>
          </div>
        </div>,
        { duration: 5000 }
      )
      
      resetForm()
      onOpenChange(false)
    }
  }

  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejection")
      return
    }
    if (requisition) {
      onReject(requisition.id, rejectReason)
      
      // Enhanced rejection notification
      toast.error(
        <div className="flex items-start gap-3">
          <XCircle className="h-5 w-5 text-destructive mt-0.5" />
          <div>
            <p className="font-semibold">Requisition Rejected</p>
            <p className="text-sm text-muted-foreground">
              {requisition.id} - {requisition.role}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Notification sent to {requisition.manager}
            </p>
          </div>
        </div>,
        { duration: 5000 }
      )
      
      resetForm()
      onOpenChange(false)
    }
  }

  const resetForm = () => {
    setSalaryMax("")
    setReviewComments("")
    setRejectReason("")
    setShowRejectForm(false)
  }

  if (!requisition) return null

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm()
      onOpenChange(isOpen)
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Review Requisition</DialogTitle>
          <DialogDescription>
            Review and approve or reject this requisition request.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-muted-foreground">Requisition ID</Label>
              <p className="font-medium">{requisition.id}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Role</Label>
              <p className="font-medium">{requisition.role}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Project</Label>
              <p className="font-medium">{requisition.project}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Manager</Label>
              <p className="font-medium">{requisition.manager || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">LOB</Label>
              <p className="font-medium">{requisition.lob}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Requested Salary</Label>
              <p className="font-medium">{requisition.salary}</p>
            </div>
          </div>

          {!showRejectForm ? (
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="salaryMax">Salary Range (Max) *</Label>
                <Input
                  id="salaryMax"
                  placeholder="e.g., ₹25L"
                  value={salaryMax}
                  onChange={(e) => setSalaryMax(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter the maximum approved salary for this requisition
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reviewComments" className="flex items-center gap-2">
                  Review Comments
                  <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
                </Label>
                <Textarea
                  id="reviewComments"
                  placeholder="Add any comments or notes for the hiring manager..."
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="rejectReason">Reason for Rejection *</Label>
              <Textarea
                id="rejectReason"
                placeholder="Please provide a reason for rejecting this requisition..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
              />
            </div>
          )}
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
            <Bell className="h-4 w-4" />
            <span>The hiring manager will be notified of your decision via email.</span>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          {!showRejectForm ? (
            <>
              <Button variant="outline" onClick={() => setShowRejectForm(true)}>
                Reject
              </Button>
              <Button onClick={handleApprove} className="bg-success hover:bg-success/90 text-success-foreground">
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
      </DialogContent>
    </Dialog>
  )
}
