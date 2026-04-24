import { useState } from "react"
import { notifyUsersWithRole } from "@/services/in-app-notification"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, CheckCircle, Clock, XCircle, Send, FileCheck, Eye, FileText, MessageSquare, Paperclip } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { UserRole } from "@/components/dashboard/navigation"
import { cn } from "@/lib/utils"
import { sendNotificationEmail } from "@/services/notification-service"

export interface OfferAttachment {
  name: string
  size: number
  type: string
}

export interface OfferRequest {
  id: string
  requisitionId: string
  candidateName: string
  role: string
  project: string
  proposedSalary: string
  requestedDate: string
  requestedBy: string
  status: 'pending-approval' | 'approved' | 'rejected' | 'offer-sent' | 'accepted' | 'declined'
  joiningDate?: string
  remarks?: string
  comments?: string
  attachments?: OfferAttachment[]
}

interface OfferApprovalTableProps {
  offerRequests: OfferRequest[]
  onUpdateOffer: (id: string, updates: Partial<OfferRequest>) => void
  userRole: UserRole
}

const lifecycleStages = [
  { key: 'pending-approval', label: 'Pending', icon: Clock },
  { key: 'approved', label: 'Approved', icon: CheckCircle },
  { key: 'offer-sent', label: 'Sent', icon: Send },
  { key: 'accepted', label: 'Accepted', icon: FileCheck },
]

const getStageIndex = (status: OfferRequest['status']) => {
  if (status === 'rejected' || status === 'declined') return -1
  return lifecycleStages.findIndex(s => s.key === status)
}

const OfferLifecycleStepper = ({ status }: { status: OfferRequest['status'] }) => {
  const currentIndex = getStageIndex(status)
  const isRejected = status === 'rejected'
  const isDeclined = status === 'declined'

  if (isRejected || isDeclined) {
    return (
      <div className="flex items-center gap-1">
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-destructive/20">
          <XCircle className="h-4 w-4 text-destructive" />
        </div>
        <span className="text-xs text-destructive font-medium">
          {isRejected ? 'Rejected' : 'Declined'}
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      {lifecycleStages.map((stage, index) => {
        const Icon = stage.icon
        const isCompleted = index < currentIndex
        const isCurrent = index === currentIndex
        const isPending = index > currentIndex

        return (
          <div key={stage.key} className="flex items-center">
            <div
              className={cn(
                "flex items-center justify-center w-6 h-6 rounded-full transition-colors",
                isCompleted && "bg-success/20",
                isCurrent && "bg-primary/20 ring-2 ring-primary/40",
                isPending && "bg-muted"
              )}
              title={stage.label}
            >
              <Icon
                className={cn(
                  "h-3.5 w-3.5",
                  isCompleted && "text-success",
                  isCurrent && "text-primary",
                  isPending && "text-muted-foreground/50"
                )}
              />
            </div>
            {index < lifecycleStages.length - 1 && (
              <div
                className={cn(
                  "w-4 h-0.5 mx-0.5",
                  index < currentIndex ? "bg-success" : "bg-muted"
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

const getStatusBadge = (status: OfferRequest['status']) => {
  switch (status) {
    case 'pending-approval':
      return (
        <Badge className="bg-warning/10 text-warning border-warning/20">
          <Clock className="h-3 w-3 mr-1" />
          Pending Approval
        </Badge>
      )
    case 'approved':
      return (
        <Badge className="bg-success/10 text-success border-success/20">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      )
    case 'rejected':
      return (
        <Badge className="bg-destructive/10 text-destructive border-destructive/20">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      )
    case 'offer-sent':
      return (
        <Badge className="bg-primary/10 text-primary border-primary/20">
          <Send className="h-3 w-3 mr-1" />
          Offer Sent
        </Badge>
      )
    case 'accepted':
      return (
        <Badge className="bg-success/10 text-success border-success/20">
          <FileCheck className="h-3 w-3 mr-1" />
          Accepted
        </Badge>
      )
    case 'declined':
      return (
        <Badge className="bg-destructive/10 text-destructive border-destructive/20">
          <XCircle className="h-3 w-3 mr-1" />
          Declined
        </Badge>
      )
  }
}

export function OfferApprovalTable({ offerRequests, onUpdateOffer, userRole }: OfferApprovalTableProps) {
  const [selectedOffer, setSelectedOffer] = useState<OfferRequest | null>(null)
  const [dialogMode, setDialogMode] = useState<'view' | 'approve' | 'send' | null>(null)
  const [remarks, setRemarks] = useState("")
  const [joiningDate, setJoiningDate] = useState("")

  const pendingCount = offerRequests.filter(o => o.status === 'pending-approval').length
  const approvedCount = offerRequests.filter(o => o.status === 'approved').length
  const sentCount = offerRequests.filter(o => o.status === 'offer-sent' || o.status === 'accepted' || o.status === 'declined').length

  const handleApprove = () => {
    if (selectedOffer) {
      onUpdateOffer(selectedOffer.id, { 
        status: 'approved',
        remarks: remarks || 'Approved by LOB Head'
      })
      
      // Send notification to TAG
      sendNotificationEmail({
        type: 'offer_approved',
        recipientEmail: 'tag@example.com',
        recipientName: 'TAG Manager',
        senderName: 'LOB Head',
        requisitionId: selectedOffer.requisitionId,
        candidateName: selectedOffer.candidateName,
        role: selectedOffer.role,
        comments: remarks
      })
      
      // In-app notification to TAG
      notifyUsersWithRole('tag-manager', 'Offer Approved', `Offer for ${selectedOffer.candidateName} (${selectedOffer.role}) has been approved. Ready to send.`, 'approved', { offerId: selectedOffer.id }, 'offer_approved')

      toast({
        title: "Offer Approved",
        description: `Offer for ${selectedOffer.candidateName} has been approved.`,
      })
      setDialogMode(null)
      setSelectedOffer(null)
      setRemarks("")
    }
  }

  const handleReject = () => {
    if (selectedOffer) {
      onUpdateOffer(selectedOffer.id, { 
        status: 'rejected',
        remarks: remarks || 'Rejected by LOB Head'
      })
      
      // Send notification to TAG
      sendNotificationEmail({
        type: 'offer_rejected',
        recipientEmail: 'tag@example.com',
        recipientName: 'TAG Manager',
        senderName: 'LOB Head',
        requisitionId: selectedOffer.requisitionId,
        candidateName: selectedOffer.candidateName,
        role: selectedOffer.role,
        reason: remarks
      })
      // In-app notification to TAG
      notifyUsersWithRole('tag-manager', 'Offer Rejected', `Offer for ${selectedOffer.candidateName} (${selectedOffer.role}) was rejected. Reason: ${remarks || 'No reason provided'}`, 'rejected', { offerId: selectedOffer.id }, 'offer_rejected')
      
      toast({
        title: "Offer Rejected",
        description: `Offer for ${selectedOffer.candidateName} has been rejected.`,
      })
      setDialogMode(null)
      setSelectedOffer(null)
      setRemarks("")
    }
  }

  const handleSendOffer = () => {
    if (selectedOffer && joiningDate) {
      onUpdateOffer(selectedOffer.id, { 
        status: 'offer-sent',
        joiningDate: joiningDate
      })
      // In-app: notify LOB Head and HM
      notifyUsersWithRole('lob-head', 'Offer Sent', `Offer sent to ${selectedOffer.candidateName} for ${selectedOffer.role}. Joining: ${new Date(joiningDate).toLocaleDateString('en-IN')}`, 'offer', { offerId: selectedOffer.id }, 'offer_routed')
      notifyUsersWithRole('hiring-manager', 'Offer Sent', `Offer sent to ${selectedOffer.candidateName} for ${selectedOffer.role}. Joining: ${new Date(joiningDate).toLocaleDateString('en-IN')}`, 'offer', { offerId: selectedOffer.id }, 'offer_routed')
      toast({
        title: "Offer Sent",
        description: `Offer has been sent to ${selectedOffer.candidateName} with joining date ${new Date(joiningDate).toLocaleDateString('en-IN')}.`,
      })
      setDialogMode(null)
      setSelectedOffer(null)
      setJoiningDate("")
    }
  }

  const handleMarkResponse = (offerId: string, response: 'accepted' | 'declined') => {
    const offer = offerRequests.find(o => o.id === offerId)
    if (offer) {
      onUpdateOffer(offerId, { status: response })
      // In-app: notify all roles about candidate response
      const title = response === 'accepted' ? 'Offer Accepted' : 'Offer Declined'
      const body = `${offer.candidateName} has ${response} the offer for ${offer.role}.`
      const type = response === 'accepted' ? 'approved' as const : 'rejected' as const
      notifyUsersWithRole('lob-head', title, body, type, { offerId }, response === 'accepted' ? 'offer_approved' : 'offer_rejected')
      notifyUsersWithRole('hiring-manager', title, body, type, { offerId }, response === 'accepted' ? 'offer_approved' : 'offer_rejected')
      toast({
        title: response === 'accepted' ? "Offer Accepted" : "Offer Declined",
        description: `${offer.candidateName} has ${response} the offer.`,
      })
    }
  }

  const openDialog = (offer: OfferRequest, mode: 'view' | 'approve' | 'send') => {
    setSelectedOffer(offer)
    setDialogMode(mode)
    setRemarks(offer.remarks || "")
    setJoiningDate(offer.joiningDate || "")
  }

  // Filter offers based on role
  const filteredOffers = userRole === 'lob-head' 
    ? offerRequests.filter(o => o.status === 'pending-approval')
    : offerRequests

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="text-xl sm:text-2xl font-bold text-warning">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Approved</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="text-xl sm:text-2xl font-bold text-success">{approvedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Sent</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="text-xl sm:text-2xl font-bold text-primary">{sentCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Offers */}
      <Card>
        <CardHeader className="px-3 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Calendar className="h-5 w-5 text-primary" />
            {userRole === 'lob-head' ? 'Pending Offer Approvals' : 'Offer Pipeline'}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          {filteredOffers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {userRole === 'lob-head' ? 'No pending offer approvals' : 'No offers in pipeline'}
            </p>
          ) : (
            <>
              {/* Mobile card layout */}
              <div className="block md:hidden space-y-3">
                {filteredOffers.map((offer) => (
                  <div key={offer.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">{offer.id}</span>
                      {getStatusBadge(offer.status)}
                    </div>
                    <p className="font-semibold text-sm">{offer.candidateName}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>Role: <span className="text-foreground">{offer.role}</span></span>
                      <span>Project: <span className="text-foreground">{offer.project}</span></span>
                      <span>Salary: <span className="text-foreground">{offer.proposedSalary}</span></span>
                    </div>
                    {offer.joiningDate && (
                      <p className="text-xs text-muted-foreground">
                        Joining: <span className="text-foreground">{new Date(offer.joiningDate).toLocaleDateString('en-IN')}</span>
                      </p>
                    )}
                    <div className="pt-1">
                      <OfferLifecycleStepper status={offer.status} />
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button variant="ghost" size="sm" onClick={() => openDialog(offer, 'view')}>
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                      {userRole === 'lob-head' && offer.status === 'pending-approval' && (
                        <Button variant="default" size="sm" onClick={() => openDialog(offer, 'approve')}>
                          <CheckCircle className="h-4 w-4 mr-1" /> Review
                        </Button>
                      )}
                      {userRole === 'tag-manager' && offer.status === 'approved' && (
                        <Button variant="default" size="sm" onClick={() => openDialog(offer, 'send')}>
                          <Send className="h-4 w-4 mr-1" /> Send
                        </Button>
                      )}
                      {userRole === 'tag-manager' && offer.status === 'offer-sent' && (
                        <>
                          <Button variant="outline" size="sm" className="text-success border-success" onClick={() => handleMarkResponse(offer.id, 'accepted')}>
                            Accepted
                          </Button>
                          <Button variant="outline" size="sm" className="text-destructive border-destructive" onClick={() => handleMarkResponse(offer.id, 'declined')}>
                            Declined
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop table layout */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Offer ID</TableHead>
                      <TableHead>Req ID</TableHead>
                      <TableHead>Candidate</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Salary</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Status</TableHead>
                      {filteredOffers.some(o => o.joiningDate) && (
                        <TableHead>Joining Date</TableHead>
                      )}
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOffers.map((offer) => (
                      <TableRow key={offer.id}>
                        <TableCell className="font-medium">{offer.id}</TableCell>
                        <TableCell className="font-medium text-primary">{offer.requisitionId}</TableCell>
                        <TableCell>{offer.candidateName}</TableCell>
                        <TableCell>{offer.role}</TableCell>
                        <TableCell>{offer.project}</TableCell>
                        <TableCell>{offer.proposedSalary}</TableCell>
                        <TableCell>
                          <OfferLifecycleStepper status={offer.status} />
                        </TableCell>
                        <TableCell>{getStatusBadge(offer.status)}</TableCell>
                        {filteredOffers.some(o => o.joiningDate) && (
                          <TableCell>
                            {offer.joiningDate 
                              ? new Date(offer.joiningDate).toLocaleDateString('en-IN')
                              : '-'
                            }
                          </TableCell>
                        )}
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => openDialog(offer, 'view')}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {userRole === 'lob-head' && offer.status === 'pending-approval' && (
                              <Button variant="default" size="sm" onClick={() => openDialog(offer, 'approve')}>
                                <CheckCircle className="h-4 w-4 mr-1" /> Review
                              </Button>
                            )}
                            {userRole === 'tag-manager' && offer.status === 'approved' && (
                              <Button variant="default" size="sm" onClick={() => openDialog(offer, 'send')}>
                                <Send className="h-4 w-4 mr-1" /> Send Offer
                              </Button>
                            )}
                            {userRole === 'tag-manager' && offer.status === 'offer-sent' && (
                              <>
                                <Button variant="outline" size="sm" className="text-success border-success hover:bg-success/10" onClick={() => handleMarkResponse(offer.id, 'accepted')}>
                                  Accepted
                                </Button>
                                <Button variant="outline" size="sm" className="text-destructive border-destructive hover:bg-destructive/10" onClick={() => handleMarkResponse(offer.id, 'declined')}>
                                  Declined
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* View/Approve Dialog */}
      <Dialog open={dialogMode === 'view' || dialogMode === 'approve'} onOpenChange={() => setDialogMode(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'approve' ? 'Review Offer Request' : 'Offer Details'}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === 'approve' 
                ? 'Review and approve or reject this offer request.'
                : 'View offer request details.'
              }
            </DialogDescription>
          </DialogHeader>
          
          {selectedOffer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Offer ID</Label>
                  <p className="font-medium">{selectedOffer.id}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Requisition ID</Label>
                  <p className="font-medium text-primary">{selectedOffer.requisitionId}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Candidate</Label>
                  <p className="font-medium">{selectedOffer.candidateName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Role</Label>
                  <p className="font-medium">{selectedOffer.role}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Project</Label>
                  <p className="font-medium">{selectedOffer.project}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Proposed Salary</Label>
                  <p className="font-medium text-success">{selectedOffer.proposedSalary}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Requested By</Label>
                  <p className="font-medium">{selectedOffer.requestedBy}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Request Date</Label>
                  <p className="font-medium">{new Date(selectedOffer.requestedDate).toLocaleDateString('en-IN')}</p>
                </div>
              </div>

              {/* TAG Comments */}
              {selectedOffer.comments && (
                <div className="rounded-md border p-3 bg-muted/30">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-muted-foreground text-xs font-medium">TAG Comments</Label>
                  </div>
                  <p className="text-sm">{selectedOffer.comments}</p>
                </div>
              )}

              {/* Attachments */}
              {selectedOffer.attachments && selectedOffer.attachments.length > 0 && (
                <div className="rounded-md border p-3 bg-muted/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-muted-foreground text-xs font-medium">
                      Attachments ({selectedOffer.attachments.length})
                    </Label>
                  </div>
                  <div className="space-y-2">
                    {selectedOffer.attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 bg-background rounded-md border"
                      >
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {file.size < 1024 * 1024
                              ? `${(file.size / 1024).toFixed(1)} KB`
                              : `${(file.size / (1024 * 1024)).toFixed(1)} MB`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {dialogMode === 'approve' && (
                <div>
                  <Label htmlFor="remarks">Remarks (Optional)</Label>
                  <Textarea
                    id="remarks"
                    placeholder="Add any remarks for this decision..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="mt-1"
                  />
                </div>
              )}

              {selectedOffer.remarks && dialogMode === 'view' && (
                <div>
                  <Label className="text-muted-foreground">Remarks</Label>
                  <p className="font-medium">{selectedOffer.remarks}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            {dialogMode === 'approve' ? (
              <>
                <Button variant="outline" onClick={() => setDialogMode(null)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleReject}>
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
                <Button onClick={handleApprove}>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setDialogMode(null)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Offer Dialog */}
      <Dialog open={dialogMode === 'send'} onOpenChange={() => setDialogMode(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Offer to Candidate</DialogTitle>
            <DialogDescription>
              Set the joining date and send the offer to the candidate.
            </DialogDescription>
          </DialogHeader>
          
          {selectedOffer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Candidate</Label>
                  <p className="font-medium">{selectedOffer.candidateName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Role</Label>
                  <p className="font-medium">{selectedOffer.role}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Proposed Salary</Label>
                  <p className="font-medium text-success">{selectedOffer.proposedSalary}</p>
                </div>
              </div>

              <div>
                <Label htmlFor="joiningDate">Joining Date *</Label>
                <Input
                  id="joiningDate"
                  type="date"
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  className="mt-1"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogMode(null)}>
              Cancel
            </Button>
            <Button onClick={handleSendOffer} disabled={!joiningDate}>
              <Send className="h-4 w-4 mr-1" />
              Send Offer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
