import { useState, useMemo } from "react"
import { useProjectCodes } from "@/hooks/use-project-codes"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { NewRequisitionForm } from "./new-requisition-form"
import { ApprovalReviewDialog } from "./approval-review-dialog"
import { EditRequisitionDialog } from "./edit-requisition-dialog"
import { TagStatusDialog } from "./tag-status-dialog"
import { InterviewTagDialog, type InterviewTagState } from "./interview-tag-dialog"
import { CandidateManagementDialog } from "./candidate-management-dialog"
import { RequisitionLifecycleStepper } from "./requisition-lifecycle-stepper"
import { AuditLogViewer } from "./audit-log-viewer"
import { Edit, ClipboardCheck, Filter, Search, ArrowUpDown, ArrowUp, ArrowDown, Send, Gift, Settings2, History, Users } from "lucide-react"
import { differenceInDays } from "date-fns"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useAudit } from "@/contexts/audit-context"
import { sendNotificationEmail, getRoleDisplayName } from "@/services/notification-service"
import { notifyUsersWithRole, createNotification } from "@/services/in-app-notification"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { Candidate } from "@/types/candidate"

// Helper to get current interview phase label
const getInterviewPhaseLabel = (interviewState?: InterviewTagState): string | null => {
  if (!interviewState || !interviewState.rounds.length) return null
  
  // Find the latest selected round
  const selectedRounds = interviewState.rounds.filter(r => r.status === 'selected')
  if (selectedRounds.length === 0) return null
  
  const latestSelected = selectedRounds[selectedRounds.length - 1]
  return `${latestSelected.level} Selected`
}

interface Requisition {
  id: string
  role: string
  project: string
  manager?: string
  lob: string
  level?: string
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'interview' | 'hold'
  createdDate: string
  salary: string
  interviewState?: InterviewTagState
  candidates?: Candidate[]
}

const sampleRequisitions: Requisition[] = [
  {
    id: "REQ-001",
    role: "Senior React Developer",
    project: "EEN",
    manager: "Sarah Johnson",
    lob: "Engineering",
    level: "Senior",
    status: "approved",
    createdDate: "2025-12-15",
    salary: "₹18L - ₹25L"
  },
  {
    id: "REQ-002", 
    role: "UX Designer",
    project: "Apex",
    manager: "Mike Chen",
    lob: "Design",
    level: "Mid",
    status: "pending",
    createdDate: "2025-12-20",
    salary: "₹12L - ₹18L"
  },
  {
    id: "REQ-003",
    role: "DevOps Engineer",
    project: "PRMG",
    manager: "Alex Rodriguez",
    lob: "Engineering",
    level: "Senior",
    status: "interview",
    createdDate: "2025-12-10",
    salary: "₹22L - ₹30L"
  },
  {
    id: "REQ-004",
    role: "Product Manager",
    project: "Weva",
    manager: "Lisa Thompson",
    lob: "Product",
    level: "Mid",
    status: "pending",
    createdDate: "2025-12-28",
    salary: "₹15L - ₹22L"
  },
  {
    id: "REQ-005",
    role: "Data Scientist",
    project: "Joulez",
    manager: "David Kumar",
    lob: "Analytics",
    level: "Junior",
    status: "rejected",
    createdDate: "2025-12-05",
    salary: "₹8L - ₹14L"
  },
  {
    id: "REQ-006",
    role: "Frontend Engineer",
    project: "Volta",
    manager: "Priya Sharma",
    lob: "Engineering",
    level: "Mid",
    status: "approved",
    createdDate: "2025-12-22",
    salary: "₹14L - ₹20L"
  },
  {
    id: "REQ-007",
    role: "Backend Developer",
    project: "Nova",
    manager: "John Smith",
    lob: "Engineering",
    level: "Senior",
    status: "draft",
    createdDate: "2026-01-05",
    salary: "₹16L - ₹22L"
  }
]

const getAgingColor = (days: number) => {
  if (days <= 7) return "text-green-600 bg-green-50"
  if (days <= 14) return "text-yellow-600 bg-yellow-50"
  if (days <= 21) return "text-orange-600 bg-orange-50"
  return "text-red-600 bg-red-50"
}

type SortField = 'id' | 'role' | 'project' | 'manager' | 'lob' | 'status' | 'createdDate' | 'aging'
type SortDirection = 'asc' | 'desc' | null

interface RequisitionTableProps {
  requisitions?: Requisition[]
  onAddRequisition?: (requisition: Requisition) => void
  onUpdateRequisition?: (id: string, updates: Partial<Requisition>) => void
  userRole?: 'hiring-manager' | 'lob-head' | 'tag-manager'
  showApprovalActions?: boolean
  onRouteToOffer?: (requisition: Requisition) => void
  onUpdateInterviewState?: (id: string, state: InterviewTagState) => void
  onUpdateCandidates?: (id: string, candidates: Candidate[]) => void
  onRouteCandidateToOffer?: (requisition: Requisition, candidate: Candidate) => void
}

export function RequisitionTable({ 
  requisitions = sampleRequisitions, 
  onAddRequisition,
  onUpdateRequisition,
  userRole = 'hiring-manager',
  showApprovalActions = false,
  onRouteToOffer,
  onUpdateInterviewState,
  onUpdateCandidates,
  onRouteCandidateToOffer
}: RequisitionTableProps) {
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [tagStatusDialogOpen, setTagStatusDialogOpen] = useState(false)
  const [interviewTagDialogOpen, setInterviewTagDialogOpen] = useState(false)
  const [candidateManagementDialogOpen, setCandidateManagementDialogOpen] = useState(false)
  const [auditLogDialogOpen, setAuditLogDialogOpen] = useState(false)
  const [selectedRequisition, setSelectedRequisition] = useState<Requisition | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [experienceFilter, setExperienceFilter] = useState<string>("all")
  const [projectFilter, setProjectFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  
  const { addAuditLog, getLogsForRequisition } = useAudit()
  const { projectCodes } = useProjectCodes()

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortField(null)
        setSortDirection(null)
      }
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1" />
    if (sortDirection === 'asc') return <ArrowUp className="h-3 w-3 ml-1" />
    return <ArrowDown className="h-3 w-3 ml-1" />
  }

  const filteredAndSortedRequisitions = useMemo(() => {
    let result = requisitions

    // Hide draft requisitions from LOB Head and Tag Manager
    if (userRole === 'lob-head' || userRole === 'tag-manager') {
      result = result.filter(req => req.status !== 'draft')
    }

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter(req => req.status === statusFilter)
    }

    // Apply experience filter
    if (experienceFilter !== "all") {
      result = result.filter(req => req.level === experienceFilter)
    }

    // Apply project filter
    if (projectFilter !== "all") {
      result = result.filter(req => req.project === projectFilter)
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      const isExactProjectSearch =
        projectCodes.some((code) => code.toLowerCase() === query) ||
        requisitions.some((req) => req.project.toLowerCase() === query)

      result = result.filter(req => {
        const projectMatch = req.project.toLowerCase() === query

        if (isExactProjectSearch) {
          return projectMatch
        }

        return (
          req.id.toLowerCase().includes(query) ||
          req.role.toLowerCase().includes(query) ||
          (req.manager?.toLowerCase().includes(query) ?? false) ||
          (req.lob?.toLowerCase().includes(query) ?? false)
        )
      })
    }

    if (sortField && sortDirection) {
      result = [...result].sort((a, b) => {
        let aValue: string | number
        let bValue: string | number

        if (sortField === 'aging') {
          aValue = differenceInDays(new Date(), new Date(a.createdDate))
          bValue = differenceInDays(new Date(), new Date(b.createdDate))
        } else if (sortField === 'createdDate') {
          aValue = new Date(a.createdDate).getTime()
          bValue = new Date(b.createdDate).getTime()
        } else {
          aValue = (a[sortField] ?? '').toString().toLowerCase()
          bValue = (b[sortField] ?? '').toString().toLowerCase()
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
        return 0
      })
    }

    return result
  }, [requisitions, statusFilter, experienceFilter, projectFilter, searchQuery, sortField, sortDirection, userRole, projectCodes])

  const handleCreateRequisition = (newRequisition: Requisition) => {
    onAddRequisition?.(newRequisition)
    addAuditLog(
      newRequisition.id,
      null,
      newRequisition.status,
      { role: getRoleDisplayName(userRole), name: getRoleDisplayName(userRole) },
      'created',
      'Requisition created'
    )
  }

  const handleEditClick = (req: Requisition) => {
    setSelectedRequisition(req)
    setEditDialogOpen(true)
  }

  const handleReviewClick = (req: Requisition) => {
    setSelectedRequisition(req)
    setReviewDialogOpen(true)
  }

  const handleApprove = (id: string, salaryMax: string, comments?: string) => {
    if (onUpdateRequisition) {
      const req = requisitions.find(r => r.id === id)
      if (req) {
        addAuditLog(id, 'pending', 'approved', { role: 'LOB Head', name: 'LOB Head' }, 'approved', comments)
        sendNotificationEmail({
          type: 'requisition_approved',
          recipientEmail: 'manager@example.com',
          recipientName: req.manager || 'Hiring Manager',
          senderName: 'LOB Head',
          requisitionId: id,
          role: req.role,
          project: req.project,
          comments
        })
        notifyUsersWithRole('tag-manager', 'Requisition Approved', `${req.role} (${req.project}) has been approved and is ready for sourcing.`, 'approved', { requisitionId: id }, 'requisition_approved')
        if (req.manager) {
          notifyUsersWithRole('hiring-manager', 'Requisition Approved', `Your requisition for ${req.role} (${req.project}) has been approved.`, 'approved', { requisitionId: id }, 'requisition_approved')
        }
      }
      onUpdateRequisition(id, { status: 'approved' })
    }
  }

  const handleReject = (id: string, reason: string) => {
    if (onUpdateRequisition) {
      const req = requisitions.find(r => r.id === id)
      if (req) {
        addAuditLog(id, 'pending', 'rejected', { role: 'LOB Head', name: 'LOB Head' }, 'rejected', reason)
        sendNotificationEmail({
          type: 'requisition_rejected',
          recipientEmail: 'manager@example.com',
          recipientName: req.manager || 'Hiring Manager',
          senderName: 'LOB Head',
          requisitionId: id,
          role: req.role,
          project: req.project,
          reason
        })
        notifyUsersWithRole('hiring-manager', 'Requisition Rejected', `Your requisition for ${req.role} (${req.project}) was rejected. Reason: ${reason}`, 'rejected', { requisitionId: id }, 'requisition_rejected')
      }
      onUpdateRequisition(id, { status: 'rejected' })
    }
  }

  const handleTagStatusClick = (req: Requisition) => {
    setSelectedRequisition(req)
    setTagStatusDialogOpen(true)
  }

  const handleTagStatusUpdate = (id: string, status: 'interview' | 'hold', notes?: string) => {
    if (onUpdateRequisition) {
      const req = requisitions.find(r => r.id === id)
      if (req) {
        addAuditLog(
          id,
          req.status,
          status,
          { role: 'TAG Manager', name: 'TAG Manager' },
          'status_changed',
          notes
        )
      }
      onUpdateRequisition(id, { status })
    }
  }

  const handleSubmitForApproval = (req: Requisition) => {
    addAuditLog(req.id, 'draft', 'pending', { role: getRoleDisplayName(userRole), name: getRoleDisplayName(userRole) }, 'submitted')
    sendNotificationEmail({
      type: 'requisition_submitted',
      recipientEmail: 'lobhead@example.com',
      recipientName: 'LOB Head',
      senderName: req.manager || 'Hiring Manager',
      requisitionId: req.id,
      role: req.role,
      project: req.project
    })
    notifyUsersWithRole('lob-head', 'New Requisition for Approval', `${req.role} (${req.project}) submitted by ${req.manager || 'Hiring Manager'} requires your review.`, 'approval', { requisitionId: req.id }, 'requisition_submitted')
    onUpdateRequisition?.(req.id, { status: 'pending' })
  }

  const handleViewAuditLog = (req: Requisition) => {
    setSelectedRequisition(req)
    setAuditLogDialogOpen(true)
  }

  const handleInterviewTagClick = (req: Requisition) => {
    setSelectedRequisition(req)
    setInterviewTagDialogOpen(true)
  }

  const handleInterviewUpdate = (id: string, state: InterviewTagState, notes?: string) => {
    if (onUpdateInterviewState) {
      const req = requisitions.find(r => r.id === id)
      if (req) {
        addAuditLog(
          id,
          req.status,
          state.isRejected ? 'rejected' : state.isOnHold ? 'hold' : 'interview',
          { role: 'TAG', name: 'TAG' },
          'interview_updated',
          notes || `Interview rounds updated: ${state.rounds.map(r => `${r.level}: ${r.status}`).join(', ')}`
        )
      }
      onUpdateInterviewState(id, state)
      
      if (state.isRejected) {
        onUpdateRequisition?.(id, { status: 'rejected' })
      } else if (state.isOnHold) {
        onUpdateRequisition?.(id, { status: 'hold' })
      }
    }
  }

  const handleRouteToOfferFromInterview = (req: Requisition) => {
    if (onRouteToOffer) {
      addAuditLog(
        req.id,
        'interview',
        'offer',
        { role: 'TAG', name: 'TAG' },
        'routed_to_offer',
        'Interview completed, candidate routed to offer stage'
      )
      onRouteToOffer(req)
    }
  }

  const handleCandidateManagementClick = (req: Requisition) => {
    setSelectedRequisition(req)
    setCandidateManagementDialogOpen(true)
  }

  const handleUpdateCandidates = (reqId: string, candidates: Candidate[]) => {
    if (onUpdateCandidates) {
      onUpdateCandidates(reqId, candidates)
    }
  }

  const handleRouteCandidateToOffer = (req: Requisition, candidate: Candidate) => {
    if (onRouteCandidateToOffer) {
      addAuditLog(
        req.id,
        'interview',
        'offer',
        { role: 'TAG', name: 'TAG' },
        'routed_to_offer',
        `Candidate "${candidate.name}" routed to offer stage`
      )
      onRouteCandidateToOffer(req, candidate)
    }
  }

  const handleEditSave = (id: string, updates: Partial<Requisition>) => {
    const existingRequisition = requisitions.find(r => r.id === id)

    if (existingRequisition) {
      const changedFields = [
        updates.role !== undefined && updates.role !== existingRequisition.role ? 'role' : null,
        updates.project !== undefined && updates.project !== existingRequisition.project ? 'project' : null,
        updates.lob !== undefined && updates.lob !== existingRequisition.lob ? 'LOB' : null,
        updates.salary !== undefined && updates.salary !== existingRequisition.salary ? 'salary' : null,
      ].filter(Boolean) as string[]

      const nextStatus = updates.status ?? existingRequisition.status
      const statusChanged = updates.status !== undefined && updates.status !== existingRequisition.status
      const actor = {
        role: getRoleDisplayName(userRole),
        name: getRoleDisplayName(userRole),
      }

      if (statusChanged) {
        const action = nextStatus === 'approved'
          ? 'approved'
          : nextStatus === 'rejected'
            ? 'rejected'
            : existingRequisition.status === 'draft' && nextStatus === 'pending'
              ? 'submitted'
              : 'status_changed'

        const notes = changedFields.length > 0
          ? `Updated fields: ${changedFields.join(', ')}`
          : 'Status updated from Actions tab'

        addAuditLog(id, existingRequisition.status, nextStatus, actor, action, notes)
      } else if (changedFields.length > 0) {
        addAuditLog(
          id,
          existingRequisition.status,
          existingRequisition.status,
          actor,
          'updated',
          `Updated fields: ${changedFields.join(', ')}`
        )
      }
    }

    onUpdateRequisition?.(id, updates)
  }

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center">
        {children}
        {getSortIcon(field)}
      </div>
    </TableHead>
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base sm:text-lg">
                {showApprovalActions ? "Requisition Approvals" : "Recent Requisitions"}
              </CardTitle>
              {showApprovalActions && (
                <p className="text-sm text-muted-foreground">
                  Review pending requisitions by REQ ID and approve or reject them.
                </p>
              )}
            </div>
            {onAddRequisition && (userRole === 'hiring-manager' || userRole === 'lob-head') && !showApprovalActions && (
              <NewRequisitionForm onSubmit={handleCreateRequisition} userRole={userRole} />
            )}
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder={showApprovalActions ? "Search REQ ID, role, project, manager..." : "Search role, project, manager..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto">
              <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[120px] sm:w-[140px] h-9 flex-shrink-0">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="interview">Interview</SelectItem>
                  <SelectItem value="hold">Hold</SelectItem>
                </SelectContent>
              </Select>
              <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                <SelectTrigger className="w-[120px] sm:w-[160px] h-9 flex-shrink-0">
                  <SelectValue placeholder="Experience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Experience</SelectItem>
                  <SelectItem value="Junior">Junior</SelectItem>
                  <SelectItem value="Mid">Mid</SelectItem>
                  <SelectItem value="Senior">Senior</SelectItem>
                  <SelectItem value="Lead">Lead</SelectItem>
                </SelectContent>
              </Select>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-[120px] sm:w-[150px] h-9 flex-shrink-0">
                  <SelectValue placeholder="Project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projectCodes.map((code) => (
                    <SelectItem key={code} value={code}>{code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <div className="block md:hidden space-y-3">
          {filteredAndSortedRequisitions.map((req) => {
            const agingDays = differenceInDays(new Date(), new Date(req.createdDate))
            const hasAuditHistory = getLogsForRequisition(req.id).length > 0

            return (
              <div key={req.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">REQ ID</span>
                    <p className="text-sm font-semibold text-foreground">{req.id}</p>
                  </div>
                  <StatusBadge variant={req.status}>
                    {req.status.charAt(0).toUpperCase() + req.status.slice(1).replace('-', ' ')}
                  </StatusBadge>
                </div>
                <p className="font-semibold text-sm">{req.role}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>Project: <span className="text-foreground">{req.project}</span></span>
                  {req.manager && <span>Manager: <span className="text-foreground">{req.manager}</span></span>}
                  <span>Level: <span className="text-foreground">{req.level || '—'}</span></span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{new Date(req.createdDate).toLocaleDateString()}</span>
                  {req.status !== 'draft' && (
                    <span className={cn("px-2 py-0.5 rounded font-medium", getAgingColor(agingDays))}>
                      {agingDays}d aging
                    </span>
                  )}
                </div>
                <div className="pt-1">
                  <RequisitionLifecycleStepper status={req.status} />
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {req.status === 'draft' && (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => handleEditClick(req)}>
                        <Edit className="h-4 w-4 mr-1" /> Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleSubmitForApproval(req)} className="text-primary">
                        <Send className="h-4 w-4 mr-1" /> Submit
                      </Button>
                    </>
                  )}
                  {userRole === 'lob-head' && req.status === 'pending' && (
                    <Button variant="outline" size="sm" onClick={() => handleReviewClick(req)} className="text-primary">
                      <ClipboardCheck className="h-4 w-4 mr-1" /> Review
                    </Button>
                  )}
                  {userRole === 'tag-manager' && (req.status === 'approved' || req.status === 'hold') && (
                    <Button variant="outline" size="sm" onClick={() => handleTagStatusClick(req)} className="text-primary">
                      <Settings2 className="h-4 w-4 mr-1" /> Update
                    </Button>
                  )}
                  {userRole === 'tag-manager' && req.status === 'interview' && (
                    <Button variant="outline" size="sm" onClick={() => handleCandidateManagementClick(req)} className="text-primary">
                      <Users className="h-4 w-4 mr-1" /> Interviews
                    </Button>
                  )}
                  {(req.status !== 'draft' || hasAuditHistory) && (
                    <Button variant="ghost" size="sm" onClick={() => handleViewAuditLog(req)}>
                      <History className="h-4 w-4 mr-1" /> History
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className={cn(showApprovalActions && "sticky left-0 z-20 bg-card")}>Requisition ID</TableHead>
              <SortableHeader field="role">Role</SortableHeader>
              <SortableHeader field="project">Project</SortableHeader>
              {(userRole === 'lob-head' || userRole === 'tag-manager') && (
                <SortableHeader field="manager">Manager</SortableHeader>
              )}
              <TableHead>Experience</TableHead>
              <TableHead>Progress</TableHead>
              <SortableHeader field="status">Status</SortableHeader>
              <SortableHeader field="createdDate">Created</SortableHeader>
              <SortableHeader field="aging">Aging (Days)</SortableHeader>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedRequisitions.map((req) => {
              const agingDays = differenceInDays(new Date(), new Date(req.createdDate))
              const hasAuditHistory = getLogsForRequisition(req.id).length > 0

              return (
                <TableRow key={req.id} className="hover:bg-muted/50">
                  <TableCell className={cn("font-medium", showApprovalActions && "sticky left-0 z-10 bg-card shadow-[1px_0_0_hsl(var(--border))]")}>
                    <div className="min-w-[108px]">
                      <span className="block text-[11px] uppercase tracking-wide text-muted-foreground md:hidden">REQ ID</span>
                      <span className="font-semibold text-foreground">{req.id}</span>
                    </div>
                  </TableCell>
                  <TableCell>{req.role}</TableCell>
                  <TableCell>{req.project}</TableCell>
                  {(userRole === 'lob-head' || userRole === 'tag-manager') && (
                    <TableCell>{req.manager}</TableCell>
                  )}
                  <TableCell>{req.level || '—'}</TableCell>
                  <TableCell>
                    <RequisitionLifecycleStepper status={req.status} />
                  </TableCell>
                  <TableCell>
                    {req.status === 'interview' && userRole === 'hiring-manager' && req.interviewState ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="cursor-help">
                              <StatusBadge variant={req.status}>
                                {req.status.charAt(0).toUpperCase() + req.status.slice(1).replace('-', ' ')}
                              </StatusBadge>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-medium">{getInterviewPhaseLabel(req.interviewState) || 'In Progress'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <StatusBadge variant={req.status}>
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1).replace('-', ' ')}
                      </StatusBadge>
                    )}
                  </TableCell>
                  <TableCell>{new Date(req.createdDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {req.status !== 'draft' ? (
                      <span className={cn("px-2 py-1 rounded-md font-medium text-sm", getAgingColor(agingDays))}>
                        {agingDays}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {req.status === 'draft' && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditClick(req)}
                            title="Edit requisition"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleSubmitForApproval(req)}
                            className="text-primary"
                            title="Submit for approval"
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Submit
                          </Button>
                        </>
                      )}
                      {userRole === 'lob-head' && req.status === 'pending' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleReviewClick(req)}
                          className="text-primary"
                        >
                          <ClipboardCheck className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      )}
                      {userRole === 'tag-manager' && (req.status === 'approved' || req.status === 'hold') && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleTagStatusClick(req)}
                          className="text-primary"
                        >
                          <Settings2 className="h-4 w-4 mr-1" />
                          Update Status
                        </Button>
                      )}
                      {userRole === 'tag-manager' && req.status === 'interview' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleCandidateManagementClick(req)}
                          className="text-primary"
                        >
                          <Users className="h-4 w-4 mr-1" />
                          Manage Interview Rounds
                        </Button>
                      )}
                      {(req.status !== 'draft' || hasAuditHistory) && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewAuditLog(req)}
                          title="View history"
                        >
                          <History className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        </div>
      </CardContent>

      <EditRequisitionDialog
        requisition={selectedRequisition}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleEditSave}
        userRole={userRole}
      />

      <ApprovalReviewDialog
        requisition={selectedRequisition}
        open={reviewDialogOpen}
        onOpenChange={setReviewDialogOpen}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      <TagStatusDialog
        requisition={selectedRequisition}
        open={tagStatusDialogOpen}
        onOpenChange={setTagStatusDialogOpen}
        onUpdateStatus={handleTagStatusUpdate}
      />

      <InterviewTagDialog
        requisition={selectedRequisition}
        open={interviewTagDialogOpen}
        onOpenChange={setInterviewTagDialogOpen}
        onUpdateInterview={handleInterviewUpdate}
        onRouteToOffer={handleRouteToOfferFromInterview}
      />

      <AuditLogViewer
        requisitionId={selectedRequisition?.id || null}
        open={auditLogDialogOpen}
        onOpenChange={setAuditLogDialogOpen}
      />

      <CandidateManagementDialog
        requisition={selectedRequisition}
        open={candidateManagementDialogOpen}
        onOpenChange={setCandidateManagementDialogOpen}
        onUpdateCandidates={handleUpdateCandidates}
        onRouteToOffer={handleRouteCandidateToOffer}
      />
    </Card>
  )
}