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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Calendar, AlertTriangle, RotateCcw } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export interface ExtendedOffer {
  id: string
  requisitionId: string
  candidateName: string
  role: string
  project: string
  offerDate: string
  joiningDate: string
  salary: string
  status: 'accepted' | 'pending' | 'declined' | 'no-show' | 'backed-out' | 'joining-date-revised' | 'joined'
  joiningDateHistory?: { date: string; remarks?: string }[]
  backedOutReason?: string
  backedOutComments?: string
  isLocked?: boolean
  joinedDate?: string
}

interface NoShowActionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  offer: ExtendedOffer | null
  onPushJoiningDate: (offerId: string, newDate: string, remarks?: string) => void
  onMarkBackedOut: (offerId: string, reason: string, comments?: string, reInitiate?: boolean) => void
}

const BACKED_OUT_REASONS = [
  "Accepted another offer",
  "Personal reasons",
  "Relocation issues",
  "Salary expectations not met",
  "Health issues",
  "Higher studies",
  "Counter-offer accepted",
  "Other"
]

export function NoShowActionsDialog({
  open,
  onOpenChange,
  offer,
  onPushJoiningDate,
  onMarkBackedOut
}: NoShowActionsDialogProps) {
  const [actionType, setActionType] = useState<'push-date' | 'backed-out' | null>(null)
  const [newJoiningDate, setNewJoiningDate] = useState("")
  const [dateRemarks, setDateRemarks] = useState("")
  const [backedOutReason, setBackedOutReason] = useState("")
  const [backedOutComments, setBackedOutComments] = useState("")
  const [reInitiate, setReInitiate] = useState<boolean | null>(null)

  const resetForm = () => {
    setActionType(null)
    setNewJoiningDate("")
    setDateRemarks("")
    setBackedOutReason("")
    setBackedOutComments("")
    setReInitiate(null)
  }

  const handleClose = () => {
    resetForm()
    onOpenChange(false)
  }

  const handlePushDate = () => {
    if (!offer || !newJoiningDate) return
    
    onPushJoiningDate(offer.id, newJoiningDate, dateRemarks || undefined)
    
    toast({
      title: "Joining Date Updated",
      description: `New joining date set to ${new Date(newJoiningDate).toLocaleDateString('en-IN')} for ${offer.candidateName}.`,
    })
    
    handleClose()
  }

  const handleBackedOut = () => {
    if (!offer || !backedOutReason || reInitiate === null) return
    
    onMarkBackedOut(offer.id, backedOutReason, backedOutComments || undefined, reInitiate)
    
    toast({
      title: "Candidate Marked as Backed Out",
      description: reInitiate 
        ? `${offer.candidateName} marked as backed out. Re-initiation request sent for approval.`
        : `${offer.candidateName} marked as backed out. Requisition status unchanged.`,
    })
    
    handleClose()
  }

  if (!offer) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Manage No Show Candidate
          </DialogTitle>
          <DialogDescription>
            {offer.candidateName} has not joined on the expected date ({new Date(offer.joiningDate).toLocaleDateString('en-IN')}).
          </DialogDescription>
        </DialogHeader>

        {!actionType ? (
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">Select an action:</p>
            <div className="grid grid-cols-1 gap-3">
              <Button
                variant="outline"
                className="h-auto p-4 justify-start text-left"
                onClick={() => setActionType('push-date')}
              >
                <Calendar className="h-5 w-5 mr-3 text-primary" />
                <div>
                  <p className="font-medium">Push Joining Date</p>
                  <p className="text-xs text-muted-foreground">Update to a new joining date</p>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-auto p-4 justify-start text-left border-destructive/30 hover:bg-destructive/5"
                onClick={() => setActionType('backed-out')}
              >
                <AlertTriangle className="h-5 w-5 mr-3 text-destructive" />
                <div>
                  <p className="font-medium">Mark as Backed Out / No Show</p>
                  <p className="text-xs text-muted-foreground">Candidate will not be joining</p>
                </div>
              </Button>
            </div>
          </div>
        ) : actionType === 'push-date' ? (
          <div className="space-y-4 py-4">
            <div className="p-3 bg-muted rounded-md text-sm">
              <p><strong>Current Joining Date:</strong> {new Date(offer.joiningDate).toLocaleDateString('en-IN')}</p>
              {offer.joiningDateHistory && offer.joiningDateHistory.length > 0 && (
                <p className="text-muted-foreground mt-1">
                  Previously revised {offer.joiningDateHistory.length} time(s)
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newJoiningDate">New Joining Date *</Label>
              <Input
                id="newJoiningDate"
                type="date"
                value={newJoiningDate}
                onChange={(e) => setNewJoiningDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateRemarks">Remarks (Optional)</Label>
              <Textarea
                id="dateRemarks"
                placeholder="Reason for date change..."
                value={dateRemarks}
                onChange={(e) => setDateRemarks(e.target.value)}
                rows={2}
              />
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setActionType(null)}>
                Back
              </Button>
              <Button onClick={handlePushDate} disabled={!newJoiningDate}>
                <Calendar className="h-4 w-4 mr-1" />
                Update Joining Date
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="backedOutReason">Reason *</Label>
              <Select value={backedOutReason} onValueChange={setBackedOutReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  {BACKED_OUT_REASONS.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="backedOutComments">Additional Comments (Optional)</Label>
              <Textarea
                id="backedOutComments"
                placeholder="Any additional details..."
                value={backedOutComments}
                onChange={(e) => setBackedOutComments(e.target.value)}
                rows={2}
              />
            </div>

            {backedOutReason && (
              <div className="space-y-3 p-4 bg-muted rounded-md">
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-primary" />
                  <Label className="font-medium">Do you want to re-initiate this Requisition?</Label>
                </div>
                <RadioGroup
                  value={reInitiate === null ? "" : reInitiate ? "yes" : "no"}
                  onValueChange={(val) => setReInitiate(val === "yes")}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="reInitiate-yes" />
                    <Label htmlFor="reInitiate-yes" className="font-normal cursor-pointer">
                      Yes – Start approval workflow (Hiring Manager → LOB Head → TAG)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="reInitiate-no" />
                    <Label htmlFor="reInitiate-no" className="font-normal cursor-pointer">
                      No – Keep requisition status unchanged
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setActionType(null)}>
                Back
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleBackedOut} 
                disabled={!backedOutReason || reInitiate === null}
              >
                <AlertTriangle className="h-4 w-4 mr-1" />
                Confirm Backed Out
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
