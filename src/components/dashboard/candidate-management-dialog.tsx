import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { UserPlus, Users, Settings2, Trash2, Gift, XCircle, Clock, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import type { Candidate, CandidateInterviewState } from "@/types/candidate"
import { getDefaultInterviewState } from "@/types/candidate"
import { CandidateInterviewDialog } from "./candidate-interview-dialog"

interface Requisition {
  id: string
  role: string
  project: string
  manager?: string
  lob: string
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'interview' | 'hold'
  createdDate: string
  salary: string
  candidates?: Candidate[]
}

interface CandidateManagementDialogProps {
  requisition: Requisition | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdateCandidates: (reqId: string, candidates: Candidate[]) => void
  onRouteToOffer: (requisition: Requisition, candidate: Candidate) => void
}

const generateCandidateId = () => `CAND-${Date.now().toString(36).toUpperCase()}`

const getCandidateStatusBadge = (state: CandidateInterviewState) => {
  if (state.isRejected) {
    return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Rejected</Badge>
  }
  if (state.isOnHold) {
    return <Badge variant="secondary" className="gap-1 bg-warning-muted text-warning-foreground"><Clock className="h-3 w-3" /> On Hold</Badge>
  }
  if (state.canRouteToOffer) {
    return <Badge variant="secondary" className="gap-1 bg-success-muted text-success-foreground"><Gift className="h-3 w-3" /> Ready for Offer</Badge>
  }
  if (state.rounds.length > 0) {
    const lastRound = state.rounds[state.rounds.length - 1]
    return <Badge variant="outline" className="gap-1"><Users className="h-3 w-3" /> {lastRound.level} {lastRound.locked ? 'Completed' : 'In Progress'}</Badge>
  }
  return <Badge variant="outline" className="gap-1"><AlertCircle className="h-3 w-3" /> Not Started</Badge>
}

const getInterviewProgress = (state: CandidateInterviewState) => {
  const completedRounds = state.rounds.filter(r => r.locked && r.status === 'selected').length
  return completedRounds > 0 ? `${completedRounds}/4 rounds` : 'No rounds'
}

export function CandidateManagementDialog({
  requisition,
  open,
  onOpenChange,
  onUpdateCandidates,
  onRouteToOffer
}: CandidateManagementDialogProps) {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newCandidateName, setNewCandidateName] = useState("")
  const [newCandidateEmail, setNewCandidateEmail] = useState("")
  const [newCandidatePhone, setNewCandidatePhone] = useState("")
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [interviewDialogOpen, setInterviewDialogOpen] = useState(false)

  useEffect(() => {
    if (open) {
      setCandidates(requisition?.candidates ?? [])
    }
  }, [open, requisition?.id, requisition?.candidates])

  useEffect(() => {
    if (!selectedCandidate) return

    const updatedCandidate = candidates.find(candidate => candidate.id === selectedCandidate.id)
    if (updatedCandidate) {
      setSelectedCandidate(updatedCandidate)
    }
  }, [candidates, selectedCandidate?.id])

  const handleAddCandidate = () => {
    if (!newCandidateName.trim()) {
      toast.error("Please enter candidate name")
      return
    }

    const newCandidate: Candidate = {
      id: generateCandidateId(),
      name: newCandidateName.trim(),
      email: newCandidateEmail.trim() || undefined,
      phone: newCandidatePhone.trim() || undefined,
      addedDate: new Date().toISOString().split('T')[0],
      interviewState: getDefaultInterviewState(),
      isRoutedToOffer: false
    }

    const updatedCandidates = [...candidates, newCandidate]
    setCandidates(updatedCandidates)

    if (requisition) {
      onUpdateCandidates(requisition.id, updatedCandidates)
    }

    setNewCandidateName("")
    setNewCandidateEmail("")
    setNewCandidatePhone("")
    setShowAddForm(false)
    toast.success(`Candidate "${newCandidate.name}" added successfully`)
  }

  const handleRemoveCandidate = (candidateId: string) => {
    const candidate = candidates.find(c => c.id === candidateId)
    if (candidate?.isRoutedToOffer) {
      toast.error("Cannot remove candidate who has been routed to offer")
      return
    }

    const updatedCandidates = candidates.filter(c => c.id !== candidateId)
    setCandidates(updatedCandidates)

    if (requisition) {
      onUpdateCandidates(requisition.id, updatedCandidates)
    }
    toast.success("Candidate removed")
  }

  const handleManageInterview = (candidate: Candidate) => {
    setSelectedCandidate(candidate)
    setInterviewDialogOpen(true)
  }

  const handleUpdateCandidateInterview = (candidateId: string, state: CandidateInterviewState) => {
    const updatedCandidates = candidates.map(candidate =>
      candidate.id === candidateId ? { ...candidate, interviewState: state } : candidate
    )

    setCandidates(updatedCandidates)

    const updatedCandidate = updatedCandidates.find(candidate => candidate.id === candidateId) ?? null
    setSelectedCandidate(updatedCandidate)

    if (requisition) {
      onUpdateCandidates(requisition.id, updatedCandidates)
    }
  }

  const handleRouteToOffer = (candidate: Candidate) => {
    const updatedCandidate = { ...candidate, isRoutedToOffer: true }
    const updatedCandidates = candidates.map(existingCandidate =>
      existingCandidate.id === candidate.id ? updatedCandidate : existingCandidate
    )
    setCandidates(updatedCandidates)

    if (requisition) {
      onUpdateCandidates(requisition.id, updatedCandidates)
      onRouteToOffer(requisition, updatedCandidate)
    }
    setInterviewDialogOpen(false)
  }

  if (!requisition) return null

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Manage Interview Rounds
            </DialogTitle>
            <DialogDescription>
              {requisition.role} - {requisition.project} ({requisition.id})
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 space-y-4 overflow-y-auto pr-2">
            <div className="grid grid-cols-3 gap-4 rounded-lg bg-muted/50 p-3 text-sm">
              <div>
                <Label className="text-xs text-muted-foreground">Role</Label>
                <p className="font-medium">{requisition.role}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Project</Label>
                <p className="font-medium">{requisition.project}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Total Candidates</Label>
                <p className="font-medium">{candidates.length}</p>
              </div>
            </div>

            {!showAddForm ? (
              <Button
                variant="outline"
                onClick={() => setShowAddForm(true)}
                className="w-full"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Add Candidate
              </Button>
            ) : (
              <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold">Add New Candidate</Label>
                  <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Name *</Label>
                    <Input
                      placeholder="Candidate name"
                      value={newCandidateName}
                      onChange={(e) => setNewCandidateName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Email</Label>
                    <Input
                      type="email"
                      placeholder="Email address"
                      value={newCandidateEmail}
                      onChange={(e) => setNewCandidateEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Phone</Label>
                    <Input
                      placeholder="Phone number"
                      value={newCandidatePhone}
                      onChange={(e) => setNewCandidatePhone(e.target.value)}
                    />
                  </div>
                </div>
                <Button onClick={handleAddCandidate} className="w-full">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Candidate
                </Button>
              </div>
            )}

            {candidates.length > 0 ? (
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Candidate Name</TableHead>
                      <TableHead>Interview Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Added Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {candidates.map((candidate) => (
                      <TableRow key={candidate.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{candidate.name}</p>
                            {candidate.email && (
                              <p className="text-xs text-muted-foreground">{candidate.email}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getCandidateStatusBadge(candidate.interviewState)}</TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {getInterviewProgress(candidate.interviewState)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {new Date(candidate.addedDate).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {!candidate.isRoutedToOffer && (
                              <>
                                {!candidate.interviewState.isRejected && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleManageInterview(candidate)}
                                  >
                                    <Settings2 className="mr-1 h-4 w-4" />
                                    Manage Interview
                                  </Button>
                                )}
                                {candidate.interviewState.isRejected && (
                                  <Badge variant="destructive" className="gap-1">
                                    <XCircle className="h-3 w-3" /> Rejected
                                  </Badge>
                                )}
                                {!candidate.interviewState.isRejected && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveCandidate(candidate.id)}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </>
                            )}
                            {candidate.isRoutedToOffer && (
                              <Badge variant="secondary" className="bg-success-muted text-success-foreground">
                                <Gift className="mr-1 h-3 w-3" />
                                Routed to Offer
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="rounded-lg border bg-muted/20 py-8 text-center text-muted-foreground">
                <Users className="mx-auto mb-3 h-12 w-12 opacity-50" />
                <p className="font-medium">No candidates added yet</p>
                <p className="text-sm">Click "Add Candidate" to start managing interviews</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <CandidateInterviewDialog
        candidate={selectedCandidate}
        requisition={requisition}
        open={interviewDialogOpen}
        onOpenChange={setInterviewDialogOpen}
        onUpdateInterview={handleUpdateCandidateInterview}
        onRouteToOffer={handleRouteToOffer}
      />
    </>
  )
}
