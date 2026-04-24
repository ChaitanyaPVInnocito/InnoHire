import { useState, useMemo } from "react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertTriangle, 
  RotateCcw,
  History,
  UserCheck,
  Download,
  FileSpreadsheet,
} from "lucide-react"
import type { UserRole } from "@/components/dashboard/navigation"
import { NoShowActionsDialog, type ExtendedOffer } from "./no-show-actions-dialog"
import { ReInitiationApprovalDialog, type ReInitiationRequest } from "./re-initiation-approval-dialog"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from "@/components/ui/dialog"
import { useAudit } from "@/contexts/audit-context"
import { useOffers, type PersistedOffer } from "@/contexts/offers-context"
import { sendNotificationEmail } from "@/services/notification-service"
import { toast } from "@/hooks/use-toast"
import { MarkJoinedDialog } from "./mark-joined-dialog"
import { exportOffersToCSV, exportOffersToExcel } from "@/utils/export-csv"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface OffersReleasedProps {
  userRole: UserRole
  onRequisitionStatusChange?: (requisitionId: string, status: string) => void
}

// Convert persisted offer to extended offer format
function toExtendedOffer(offer: PersistedOffer): ExtendedOffer {
  return {
    id: offer.id,
    requisitionId: offer.requisitionId,
    candidateName: offer.candidateName,
    role: offer.role,
    project: offer.project,
    offerDate: offer.requestedDate,
    joiningDate: offer.joiningDate || offer.requestedDate,
    salary: offer.proposedSalary,
    status: mapOfferStatus(offer.status),
    joiningDateHistory: offer.joiningDateHistory?.map(h => ({ date: h.oldDate, remarks: h.remarks })),
    backedOutReason: offer.backedOutReason,
    isLocked: offer.status === 'backed-out',
    joinedDate: offer.joinedDate
  }
}

function mapOfferStatus(status: PersistedOffer['status']): ExtendedOffer['status'] {
  switch (status) {
    case 'pending-approval':
    case 'approved':
    case 'offer-sent':
      return 'pending'
    case 'accepted':
      return 'accepted'
    case 'rejected':
      return 'declined'
    case 'no-show':
      return 'no-show'
    case 'backed-out':
      return 'backed-out'
    case 'joining-date-revised':
      return 'joining-date-revised'
    case 'joined':
      return 'joined'
    default:
      return 'pending'
  }
}

// Get Joining Status badge
const getJoiningStatusBadge = (status: ExtendedOffer['status']) => {
  switch (status) {
    case 'accepted':
      return (
        <Badge className="bg-success-muted text-success-foreground border border-success/40 font-semibold">
          <CheckCircle className="h-3 w-3 mr-1" />
          Accepted
        </Badge>
      )
    case 'pending':
      return (
        <Badge className="bg-warning-muted text-warning-foreground border border-warning/40 font-semibold">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      )
    case 'declined':
      return (
        <Badge className="bg-danger-muted text-danger-foreground border border-danger/40 font-semibold">
          <XCircle className="h-3 w-3 mr-1" />
          Declined
        </Badge>
      )
    case 'no-show':
      return (
        <Badge className="bg-warning-muted text-warning-foreground border border-warning/40 font-semibold">
          <AlertTriangle className="h-3 w-3 mr-1" />
          No Show
        </Badge>
      )
    case 'joining-date-revised':
      return (
        <Badge className="bg-info-muted text-info-foreground border border-info/40 font-semibold">
          <History className="h-3 w-3 mr-1" />
          Date Revised
        </Badge>
      )
    case 'backed-out':
      return (
        <Badge className="bg-danger-muted text-danger-foreground border border-danger/40 font-semibold">
          <RotateCcw className="h-3 w-3 mr-1" />
          Backed Out
        </Badge>
      )
    case 'joined':
      return (
        <Badge className="bg-success-muted text-success-foreground border border-success/40 font-semibold">
          <UserCheck className="h-3 w-3 mr-1" />
          Joined
        </Badge>
      )
    default:
      return (
        <Badge className="bg-warning-muted text-warning-foreground border border-warning/40 font-semibold">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      )
  }
}

export function OffersReleased({ userRole, onRequisitionStatusChange }: OffersReleasedProps) {
  const { addAuditLog } = useAudit()
  const { 
    offers: persistedOffers, 
    updateOffer,
    reInitiationRequests,
    addReInitiationRequest,
    updateReInitiationRequest
  } = useOffers()

  const releasedPersistedOffers = useMemo(
    () => persistedOffers.filter((offer) => !['pending-approval', 'approved'].includes(offer.status)),
    [persistedOffers]
  )

  const offers = useMemo(() => 
    releasedPersistedOffers.map(toExtendedOffer), 
    [releasedPersistedOffers]
  )

  const [selectedOffer, setSelectedOffer] = useState<ExtendedOffer | null>(null)
  const [noShowDialogOpen, setNoShowDialogOpen] = useState(false)
  const [selectedReInitRequest, setSelectedReInitRequest] = useState<ReInitiationRequest | null>(null)
  const [reInitDialogOpen, setReInitDialogOpen] = useState(false)
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [historyOffer, setHistoryOffer] = useState<ExtendedOffer | null>(null)
  const [markJoinedDialogOpen, setMarkJoinedDialogOpen] = useState(false)
  const [selectedOfferForJoined, setSelectedOfferForJoined] = useState<PersistedOffer | null>(null)

  // Check if offer is overdue for joining but not yet explicitly marked as no-show
  const isNoShow = (offer: ExtendedOffer): boolean => {
    if (offer.status !== 'accepted') return false
    const joiningDate = new Date(offer.joiningDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    joiningDate.setHours(0, 0, 0, 0)
    return today > joiningDate
  }

  const counts = useMemo(() => {
    return {
      accepted: releasedPersistedOffers.filter((offer) => offer.status === 'accepted').length,
      pending: releasedPersistedOffers.filter((offer) => offer.status === 'offer-sent').length,
      declined: releasedPersistedOffers.filter((offer) => offer.status === 'rejected').length,
      noShow: releasedPersistedOffers.filter((offer) => offer.status === 'no-show').length,
      backedOut: releasedPersistedOffers.filter((offer) => offer.status === 'backed-out').length,
      joiningDateRevised: releasedPersistedOffers.filter((offer) => offer.status === 'joining-date-revised').length,
      joined: releasedPersistedOffers.filter((offer) => offer.status === 'joined').length,
      pendingReInitiation: reInitiationRequests.filter(r => 
        (userRole === 'hiring-manager' && r.status === 'pending-hm') ||
        (userRole === 'lob-head' && r.status === 'pending-lob')
      ).length
    }
  }, [releasedPersistedOffers, reInitiationRequests, userRole])

  const handlePushJoiningDate = (offerId: string, newDate: string, remarks?: string) => {
    const offer = persistedOffers.find(o => o.id === offerId)
    if (!offer) return

    const oldDate = offer.joiningDate || offer.requestedDate
    const newHistory = [
      ...(offer.joiningDateHistory || []),
      { oldDate, newDate, changedAt: new Date().toISOString(), remarks }
    ]

    updateOffer(offerId, {
      joiningDate: newDate,
      joiningDateHistory: newHistory,
      status: 'joining-date-revised'
    })

    addAuditLog(
      offer.requisitionId,
      'accepted',
      'joining-date-revised',
      { role: 'TAG', name: 'TAG Manager' },
      'joining_date_pushed',
      remarks,
      { oldJoiningDate: oldDate, newJoiningDate: newDate }
    )
  }

  const handleMarkBackedOut = (offerId: string, reason: string, comments?: string, reInitiate?: boolean) => {
    const offer = persistedOffers.find(o => o.id === offerId)
    if (!offer) return

    // When reInitiate is false (No - Keep requisition unchanged), set status to 'no-show' to move to No Show tab
    // When reInitiate is true, set status to 'backed-out' and start re-initiation workflow
    const newStatus = reInitiate ? 'backed-out' : 'no-show'

    // Update offer status via context
    updateOffer(offerId, {
      status: newStatus,
      backedOutReason: reason,
      backedOutAt: new Date().toISOString()
    })

    // Add audit log
    addAuditLog(
      offer.requisitionId,
      'accepted',
      newStatus,
      { role: 'TAG', name: 'TAG Manager' },
      'marked_backed_out',
      `${reason}${comments ? ` - ${comments}` : ''}`,
      { backedOutReason: reason }
    )

    // If re-initiate requested, create approval request
    if (reInitiate) {
      const newRequest: ReInitiationRequest = {
        id: `REINIT-${Date.now()}`,
        requisitionId: offer.requisitionId,
        role: offer.role,
        project: offer.project,
        originalCandidateName: offer.candidateName,
        backedOutReason: reason,
        requestedBy: 'TAG Manager',
        requestedDate: new Date().toISOString(),
        status: 'pending-hm'
      }
      
      addReInitiationRequest(newRequest)
      
      // Update requisition status
      onRequisitionStatusChange?.(offer.requisitionId, 're-initiation-requested')
      
      addAuditLog(
        offer.requisitionId,
        'offer',
        're-initiation-requested',
        { role: 'TAG', name: 'TAG Manager' },
        're_initiation_requested',
        `Candidate ${offer.candidateName} backed out. Re-initiation requested.`
      )

      // Send notification to Hiring Manager
      sendNotificationEmail({
        type: 'requisition_update',
        recipientEmail: 'hiringmanager@example.com',
        recipientName: 'Hiring Manager',
        senderName: 'TAG Manager',
        requisitionId: offer.requisitionId,
        role: offer.role,
        project: offer.project,
        status: 'Re-Initiation Requested',
        comments: `Candidate ${offer.candidateName} backed out. Your approval is required to re-initiate this requisition.`
      })
    } else {
      addAuditLog(
        offer.requisitionId,
        'offer',
        'no-show',
        { role: 'TAG', name: 'TAG Manager' },
        'marked_no_show',
        `Candidate marked as No Show. Requisition remains unchanged.`
      )
    }
  }

  const handleReInitiationApprove = (requestId: string, comments?: string) => {
    const request = reInitiationRequests.find(r => r.id === requestId)
    if (!request) return

    if (userRole === 'hiring-manager') {
      // Send to LOB Head
      sendNotificationEmail({
        type: 'requisition_update',
        recipientEmail: 'lobhead@example.com',
        recipientName: 'LOB Head',
        senderName: 'Hiring Manager',
        requisitionId: request.requisitionId,
        role: request.role,
        project: request.project,
        status: 'Re-Initiation Pending LOB Approval',
        comments: `Hiring Manager approved re-initiation. Your approval is required.`
      })

      addAuditLog(
        request.requisitionId,
        're-initiation-requested',
        're-initiation-requested',
        { role: 'Hiring Manager', name: 'Hiring Manager' },
        're_initiation_approved',
        comments,
        { approverRole: 'Hiring Manager' }
      )

      updateReInitiationRequest(requestId, {
        status: 'pending-lob',
        hmApproval: { approved: true, date: new Date().toISOString(), comments }
      })
    } else if (userRole === 'lob-head') {
      // Final approval - reopen requisition
      onRequisitionStatusChange?.(request.requisitionId, 'open')
      
      sendNotificationEmail({
        type: 'requisition_update',
        recipientEmail: 'tag@example.com',
        recipientName: 'TAG Manager',
        senderName: 'LOB Head',
        requisitionId: request.requisitionId,
        role: request.role,
        project: request.project,
        status: 'Open / Hiring In Progress',
        comments: `Re-initiation approved. Requisition is now open for sourcing.`
      })

      addAuditLog(
        request.requisitionId,
        're-initiation-requested',
        'open',
        { role: 'LOB Head', name: 'LOB Head' },
        'requisition_reopened',
        comments,
        { approverRole: 'LOB Head' }
      )

      updateReInitiationRequest(requestId, {
        status: 'approved',
        lobApproval: { approved: true, date: new Date().toISOString(), comments }
      })
    }
  }

  const handleReInitiationReject = (requestId: string, reason: string) => {
    const request = reInitiationRequests.find(r => r.id === requestId)
    if (!request) return

    onRequisitionStatusChange?.(request.requisitionId, 're-initiation-rejected')
    
    const approverRole = userRole === 'hiring-manager' ? 'Hiring Manager' : 'LOB Head'
    
    addAuditLog(
      request.requisitionId,
      're-initiation-requested',
      're-initiation-rejected',
      { role: approverRole, name: approverRole },
      're_initiation_rejected',
      reason,
      { approverRole }
    )

    // Notify TAG
    sendNotificationEmail({
      type: 'requisition_update',
      recipientEmail: 'tag@example.com',
      recipientName: 'TAG Manager',
      senderName: approverRole,
      requisitionId: request.requisitionId,
      role: request.role,
      status: 'Re-Initiation Rejected',
      reason
    })

    updateReInitiationRequest(requestId, {
      status: 'rejected',
      ...(userRole === 'hiring-manager' 
        ? { hmApproval: { approved: false, date: new Date().toISOString(), comments: reason } }
        : { lobApproval: { approved: false, date: new Date().toISOString(), comments: reason } }
      )
    })
  }

  const openNoShowDialog = (offer: ExtendedOffer) => {
    setSelectedOffer(offer)
    setNoShowDialogOpen(true)
  }

  const openReInitDialog = (request: ReInitiationRequest) => {
    setSelectedReInitRequest(request)
    setReInitDialogOpen(true)
  }

  const openHistoryDialog = (offer: ExtendedOffer) => {
    setHistoryOffer(offer)
    setHistoryDialogOpen(true)
  }

  const openMarkJoinedDialog = (offerId: string) => {
    const offer = persistedOffers.find(o => o.id === offerId)
    if (offer) {
      setSelectedOfferForJoined(offer)
      setMarkJoinedDialogOpen(true)
    }
  }

  // Filter based on role for re-initiation approvals
  const pendingReInitRequests = reInitiationRequests.filter(r => 
    (userRole === 'hiring-manager' && r.status === 'pending-hm') ||
    (userRole === 'lob-head' && r.status === 'pending-lob')
  )

  const showTAGActions = userRole === 'tag-manager'
  const hideSalary = userRole === 'hiring-manager'

  const handleMarkAsJoined = (joinedDate: string) => {
    if (!selectedOfferForJoined) return

    updateOffer(selectedOfferForJoined.id, { status: 'joined', joinedDate })
    
    addAuditLog(
      selectedOfferForJoined.requisitionId,
      'accepted',
      'joined',
      { role: 'TAG', name: 'TAG Manager' },
      'status_changed',
      `Candidate ${selectedOfferForJoined.candidateName} has joined on ${new Date(joinedDate).toLocaleDateString('en-IN')}.`
    )

    toast({
      title: "Status Updated",
      description: `${selectedOfferForJoined.candidateName} marked as Joined on ${new Date(joinedDate).toLocaleDateString('en-IN')}.`,
    })

    setMarkJoinedDialogOpen(false)
    setSelectedOfferForJoined(null)
  }

  const handleExportCSV = () => {
    exportOffersToCSV(persistedOffers, hideSalary)
    toast({
      title: "Export Complete",
      description: "Offers data has been exported to CSV.",
    })
  }

  const handleExportExcel = () => {
    exportOffersToExcel(persistedOffers, hideSalary)
    toast({
      title: "Export Complete",
      description: "Offers data has been exported to Excel.",
    })
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${userRole === 'tag-manager' ? 'lg:grid-cols-7' : 'lg:grid-cols-6'}`}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Accepted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{counts.accepted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{counts.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Declined</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{counts.declined}</div>
          </CardContent>
        </Card>
        <Card className="border-warning/30 bg-warning/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-warning">No Show</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{counts.noShow}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Backed Out</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{counts.backedOut}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Date Revised</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info">{counts.joiningDateRevised}</div>
          </CardContent>
        </Card>
        {userRole === 'tag-manager' && (
          <Card className="border-success/30 bg-success/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-success">Joined</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{counts.joined}</div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Re-Initiation Pending Approvals (for HM and LOB) */}
      {pendingReInitRequests.length > 0 && (
        <Card className="border-warning/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <RotateCcw className="h-5 w-5" />
              Pending Re-Initiation Approvals ({pendingReInitRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Requisition ID</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Original Candidate</TableHead>
                  <TableHead>Backed Out Reason</TableHead>
                  <TableHead>Requested Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingReInitRequests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium text-primary">{req.requisitionId}</TableCell>
                    <TableCell>{req.role}</TableCell>
                    <TableCell>{req.project}</TableCell>
                    <TableCell>{req.originalCandidateName}</TableCell>
                    <TableCell>{req.backedOutReason}</TableCell>
                    <TableCell>{new Date(req.requestedDate).toLocaleDateString('en-IN')}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => openReInitDialog(req)}>
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Main Offers Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              All Offers Released
            </CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportExcel}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export as Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All Offers ({offers.filter(o => o.status !== 'joined' && o.status !== 'no-show').length})</TabsTrigger>
              {showTAGActions && (
                <>
                  <TabsTrigger value="joined" className="text-success">
                    Joined ({counts.joined})
                  </TabsTrigger>
                  <TabsTrigger value="no-show" className="text-warning">
                    No Show ({offers.filter(o => o.status === 'no-show').length})
                  </TabsTrigger>
                </>
              )}
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <OffersTable 
                offers={offers.filter(o => o.status !== 'joined' && o.status !== 'no-show')} 
                isNoShow={isNoShow}
                showTAGActions={showTAGActions}
                hideSalary={hideSalary}
                onManageNoShow={openNoShowDialog}
                onViewHistory={openHistoryDialog}
                onMarkAsJoined={openMarkJoinedDialog}
                persistedOffers={persistedOffers}
              />
            </TabsContent>

            {showTAGActions && (
              <>
                <TabsContent value="joined" className="mt-4">
                  <OffersTable 
                    offers={offers.filter(o => o.status === 'joined')} 
                    isNoShow={isNoShow}
                    showTAGActions={false}
                    hideSalary={hideSalary}
                    onManageNoShow={openNoShowDialog}
                    onViewHistory={openHistoryDialog}
                    onMarkAsJoined={openMarkJoinedDialog}
                    persistedOffers={persistedOffers}
                    showActionsColumn={false}
                  />
                </TabsContent>

                <TabsContent value="no-show" className="mt-4">
                  <OffersTable 
                    offers={offers.filter(o => o.status === 'no-show')} 
                    isNoShow={isNoShow}
                    showTAGActions={false}
                    hideSalary={hideSalary}
                    onManageNoShow={openNoShowDialog}
                    onViewHistory={openHistoryDialog}
                    onMarkAsJoined={openMarkJoinedDialog}
                    persistedOffers={persistedOffers}
                    showActionsColumn={false}
                  />
                </TabsContent>
              </>
            )}
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <NoShowActionsDialog
        open={noShowDialogOpen}
        onOpenChange={setNoShowDialogOpen}
        offer={selectedOffer}
        onPushJoiningDate={handlePushJoiningDate}
        onMarkBackedOut={handleMarkBackedOut}
      />

      <ReInitiationApprovalDialog
        open={reInitDialogOpen}
        onOpenChange={setReInitDialogOpen}
        request={selectedReInitRequest}
        userRole={userRole}
        onApprove={handleReInitiationApprove}
        onReject={handleReInitiationReject}
      />

      {/* History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Joining Date History
            </DialogTitle>
            <DialogDescription>
              {historyOffer?.candidateName} - {historyOffer?.role}
            </DialogDescription>
          </DialogHeader>
          {historyOffer && (
            <div className="space-y-3">
              <div className="p-3 bg-primary/10 rounded-md">
                <p className="text-sm text-muted-foreground">Current Joining Date</p>
                <p className="font-medium text-primary">
                  {new Date(historyOffer.joiningDate).toLocaleDateString('en-IN')}
                </p>
              </div>
              
              {historyOffer.joiningDateHistory && historyOffer.joiningDateHistory.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Previous Dates:</p>
                  {historyOffer.joiningDateHistory.map((entry, idx) => (
                    <div key={idx} className="p-2 bg-muted rounded-md text-sm">
                      <p className="font-medium">{new Date(entry.date).toLocaleDateString('en-IN')}</p>
                      {entry.remarks && (
                        <p className="text-muted-foreground">{entry.remarks}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No previous date changes.</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Mark Joined Dialog */}
      <MarkJoinedDialog
        open={markJoinedDialogOpen}
        onOpenChange={setMarkJoinedDialogOpen}
        candidateName={selectedOfferForJoined?.candidateName || ''}
        expectedJoiningDate={selectedOfferForJoined?.joiningDate || selectedOfferForJoined?.requestedDate || ''}
        onConfirm={handleMarkAsJoined}
      />
    </div>
  )
}

// Extracted table component for reusability
function OffersTable({ 
  offers, 
  isNoShow,
  showTAGActions,
  hideSalary,
  onManageNoShow,
  onViewHistory,
  onMarkAsJoined,
  persistedOffers,
  showActionsColumn = true
}: {
  offers: ExtendedOffer[]
  isNoShow: (offer: ExtendedOffer) => boolean
  showTAGActions: boolean
  hideSalary: boolean
  onManageNoShow: (offer: ExtendedOffer) => void
  onViewHistory: (offer: ExtendedOffer) => void
  onMarkAsJoined: (offerId: string) => void
  persistedOffers: PersistedOffer[]
  showActionsColumn?: boolean
}) {
  if (offers.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">No offers found.</p>
    )
  }

  return (
    <>
      {/* Mobile card layout */}
      <div className="block md:hidden space-y-3">
        {offers.map((offer) => {
          const offerIsNoShow = isNoShow(offer)
          const hasHistory = offer.joiningDateHistory && offer.joiningDateHistory.length > 0
          const persistedOffer = persistedOffers.find(o => o.id === offer.id)
          const joinedDate = persistedOffer?.joinedDate
          const canTakeActions = showTAGActions && !offer.isLocked

          return (
            <div key={offer.id} className={`border rounded-lg p-3 space-y-2 ${offerIsNoShow ? "bg-warning/5 border-warning/30" : "bg-card"}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{offer.id}</span>
                {getJoiningStatusBadge(offer.status)}
              </div>
              <p className="font-semibold text-sm">{offer.candidateName}</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <div>
                  <span className="text-muted-foreground">Role:</span>{" "}
                  <span className="font-medium">{offer.role}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Req ID:</span>{" "}
                  <span className="font-medium">{offer.requisitionId}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Offer Date:</span>{" "}
                  <span>{new Date(offer.offerDate).toLocaleDateString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Joining:</span>{" "}
                  <span className={offerIsNoShow ? "text-warning font-medium" : "text-primary font-medium"}>
                    {new Date(offer.joiningDate).toLocaleDateString('en-IN')}
                    {hasHistory && <span className="ml-1 text-muted-foreground">(revised)</span>}
                  </span>
                </div>
                {joinedDate && (
                  <div>
                    <span className="text-muted-foreground">Joined:</span>{" "}
                    <span className="text-success font-medium">{new Date(joinedDate).toLocaleDateString('en-IN')}</span>
                  </div>
                )}
                {!hideSalary && (
                  <div>
                    <span className="text-muted-foreground">Salary:</span>{" "}
                    <span className="font-medium">{offer.salary}</span>
                  </div>
                )}
              </div>
              {showActionsColumn && (
                <div className="flex items-center gap-2 pt-1 border-t border-border">
                  {hasHistory && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onViewHistory(offer)}>
                      <History className="h-3 w-3 mr-1" /> History
                    </Button>
                  )}
                  {offer.isLocked ? (
                    <Badge variant="outline" className="text-muted-foreground text-xs">Locked</Badge>
                  ) : canTakeActions ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-7 text-xs">Actions</Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onMarkAsJoined(offer.id)} className="text-success focus:text-success">
                          <UserCheck className="h-4 w-4 mr-2" /> Mark as Joined
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onManageNoShow(offer)} className="text-warning focus:text-warning">
                          <AlertTriangle className="h-4 w-4 mr-2" /> Mark as No Show
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : null}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Desktop table layout */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Requisition ID</TableHead>
              <TableHead>Offer ID</TableHead>
              <TableHead>Candidate Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Offer Date</TableHead>
              <TableHead>Joining Date</TableHead>
              <TableHead>Joined Date</TableHead>
              {!hideSalary && <TableHead>Salary</TableHead>}
              <TableHead>Joining Status</TableHead>
              {showActionsColumn && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {offers.map((offer) => {
              const offerIsNoShow = isNoShow(offer)
              const hasHistory = offer.joiningDateHistory && offer.joiningDateHistory.length > 0
              const persistedOffer = persistedOffers.find(o => o.id === offer.id)
              const joinedDate = persistedOffer?.joinedDate
              const canTakeActions = showTAGActions && !offer.isLocked

              return (
                <TableRow key={offer.id} className={offerIsNoShow ? "bg-warning/5" : ""}>
                  <TableCell className="font-medium text-muted-foreground">{offer.requisitionId}</TableCell>
                  <TableCell className="font-medium">{offer.id}</TableCell>
                  <TableCell>{offer.candidateName}</TableCell>
                  <TableCell>{offer.role}</TableCell>
                  <TableCell>{new Date(offer.offerDate).toLocaleDateString('en-IN')}</TableCell>
                  <TableCell className={offerIsNoShow ? "text-warning font-medium" : "font-medium text-primary"}>
                    {new Date(offer.joiningDate).toLocaleDateString('en-IN')}
                    {hasHistory && <span className="ml-1 text-xs text-muted-foreground">(revised)</span>}
                  </TableCell>
                  <TableCell className="text-success font-medium">
                    {joinedDate ? new Date(joinedDate).toLocaleDateString('en-IN') : '-'}
                  </TableCell>
                  {!hideSalary && <TableCell>{offer.salary}</TableCell>}
                  <TableCell>{getJoiningStatusBadge(offer.status)}</TableCell>
                  {showActionsColumn && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {hasHistory && (
                          <Button variant="ghost" size="sm" onClick={() => onViewHistory(offer)}>
                            <History className="h-4 w-4" />
                          </Button>
                        )}
                        {offer.isLocked ? (
                          <Badge variant="outline" className="text-muted-foreground">Locked</Badge>
                        ) : canTakeActions ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">Actions</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onMarkAsJoined(offer.id)} className="text-success focus:text-success">
                                <UserCheck className="h-4 w-4 mr-2" /> Mark as Joined
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onManageNoShow(offer)} className="text-warning focus:text-warning">
                                <AlertTriangle className="h-4 w-4 mr-2" /> Mark as No Show
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : null}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
