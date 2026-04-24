import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Users, CheckCircle, XCircle, Clock, Gift, Lock } from "lucide-react"
import { cn } from "@/lib/utils"

type InterviewLevel = 'L1' | 'L2' | 'L3' | 'L4'
type TagStatus = 'selected' | 'rejected' | 'hold'

interface InterviewRound {
  level: InterviewLevel
  status: TagStatus
  locked: boolean
}

export interface InterviewTagState {
  rounds: InterviewRound[]
  currentLevel: InterviewLevel | null
  hasFurtherRounds: boolean | null
  isRejected: boolean
  isOnHold: boolean
  canRouteToOffer: boolean
}

interface Requisition {
  id: string
  role: string
  project: string
  manager?: string
  lob: string
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'interview' | 'hold'
  createdDate: string
  salary: string
  interviewState?: InterviewTagState
}

interface InterviewTagDialogProps {
  requisition: Requisition | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdateInterview: (id: string, state: InterviewTagState, notes?: string) => void
  onRouteToOffer: (requisition: Requisition) => void
}

const interviewLevels: { value: InterviewLevel; label: string }[] = [
  { value: 'L1', label: 'L1 Interview' },
  { value: 'L2', label: 'L2 Interview' },
  { value: 'L3', label: 'L3 Interview' },
  { value: 'L4', label: 'L4 Interview' },
]

const getNextLevel = (current: InterviewLevel): InterviewLevel | null => {
  const levels: InterviewLevel[] = ['L1', 'L2', 'L3', 'L4']
  const currentIndex = levels.indexOf(current)
  return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null
}

const getDefaultState = (): InterviewTagState => ({
  rounds: [],
  currentLevel: null,
  hasFurtherRounds: null,
  isRejected: false,
  isOnHold: false,
  canRouteToOffer: false,
})

export function InterviewTagDialog({ 
  requisition, 
  open, 
  onOpenChange, 
  onUpdateInterview,
  onRouteToOffer
}: InterviewTagDialogProps) {
  const [state, setState] = useState<InterviewTagState>(getDefaultState())
  const [currentTagStatus, setCurrentTagStatus] = useState<TagStatus | null>(null)

  // Initialize state from requisition's interviewState if available
  useEffect(() => {
    if (requisition?.interviewState) {
      setState(requisition.interviewState)
      // Set current tag status from the last unlocked round
      const lastRound = requisition.interviewState.rounds.find(r => !r.locked)
      if (lastRound) {
        setCurrentTagStatus(lastRound.status)
      }
    } else {
      setState(getDefaultState())
      setCurrentTagStatus(null)
    }
  }, [requisition])

  const handleLevelSelect = (level: InterviewLevel) => {
    // Don't allow selection if rejected or on hold
    if (state.isRejected || state.isOnHold) return
    
    // Check if this level is already locked
    const existingRound = state.rounds.find(r => r.level === level)
    if (existingRound?.locked) return

    // Only allow selecting the next available level
    const lockedRounds = state.rounds.filter(r => r.locked)
    const lastLockedLevel = lockedRounds.length > 0 
      ? lockedRounds[lockedRounds.length - 1].level 
      : null

    if (lastLockedLevel) {
      const nextAllowedLevel = getNextLevel(lastLockedLevel)
      if (level !== nextAllowedLevel) {
        toast.error(`You can only select ${nextAllowedLevel} Interview next`)
        return
      }
    } else if (level !== 'L1') {
      // First selection must be L1
      toast.error('You must start with L1 Interview')
      return
    }

    setState(prev => ({
      ...prev,
      currentLevel: level,
      rounds: prev.rounds.some(r => r.level === level)
        ? prev.rounds
        : [...prev.rounds, { level, status: 'selected', locked: false }],
    }))
    setCurrentTagStatus(null)
  }

  const handleTagStatusChange = (status: TagStatus) => {
    setCurrentTagStatus(status)
    
    const updatedRounds = state.rounds.map(r => 
      r.level === state.currentLevel ? { ...r, status } : r
    )

    if (status === 'rejected') {
      setState(prev => ({
        ...prev,
        rounds: updatedRounds,
        isRejected: true,
        isOnHold: false,
        hasFurtherRounds: null,
        canRouteToOffer: false,
      }))
    } else if (status === 'hold') {
      setState(prev => ({
        ...prev,
        rounds: updatedRounds,
        isOnHold: true,
        isRejected: false,
        hasFurtherRounds: null,
        canRouteToOffer: false,
      }))
    } else {
      // Selected - reset to allow further round question
      setState(prev => ({
        ...prev,
        rounds: updatedRounds,
        isRejected: false,
        isOnHold: false,
        hasFurtherRounds: null,
        canRouteToOffer: false,
      }))
    }
  }

  const handleFurtherRoundsChange = (hasFurther: boolean) => {
    if (hasFurther) {
      // Lock current round and prepare for next
      const nextLevel = state.currentLevel ? getNextLevel(state.currentLevel) : null
      
      if (!nextLevel) {
        toast.error('No more interview levels available. Select "No Further Rounds" to proceed.')
        return
      }

      setState(prev => ({
        ...prev,
        rounds: prev.rounds.map(r => 
          r.level === prev.currentLevel ? { ...r, locked: true } : r
        ),
        hasFurtherRounds: true,
        currentLevel: null,
        canRouteToOffer: false,
      }))
      setCurrentTagStatus(null)
    } else {
      // No further rounds - enable Route to Offer
      setState(prev => ({
        ...prev,
        hasFurtherRounds: false,
        canRouteToOffer: true,
        rounds: prev.rounds.map(r => 
          r.level === prev.currentLevel ? { ...r, locked: true } : r
        ),
      }))
    }
  }

  const handleSave = () => {
    if (requisition) {
      onUpdateInterview(requisition.id, state)
      toast.success('Interview status updated')
      onOpenChange(false)
    }
  }

  const handleRouteToOffer = () => {
    if (requisition && state.canRouteToOffer) {
      // Lock all rounds and make read-only
      const finalState: InterviewTagState = {
        ...state,
        rounds: state.rounds.map(r => ({ ...r, locked: true })),
      }
      onUpdateInterview(requisition.id, finalState)
      onRouteToOffer(requisition)
      onOpenChange(false)
    }
  }

  const getAvailableLevels = () => {
    const lockedRounds = state.rounds.filter(r => r.locked)
    if (lockedRounds.length === 0) {
      return ['L1'] as InterviewLevel[]
    }
    const lastLocked = lockedRounds[lockedRounds.length - 1].level
    const next = getNextLevel(lastLocked)
    return next ? [next] : []
  }

  const availableLevels = getAvailableLevels()
  const currentRound = state.rounds.find(r => r.level === state.currentLevel && !r.locked)
  const showFurtherRoundsQuestion = currentTagStatus === 'selected' && !state.hasFurtherRounds

  if (!requisition) return null

  const isReadOnly = state.rounds.every(r => r.locked) && state.canRouteToOffer === false && !state.isRejected && !state.isOnHold

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        setState(getDefaultState())
        setCurrentTagStatus(null)
      }
      onOpenChange(isOpen)
    }}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Manage Interview Rounds</DialogTitle>
          <DialogDescription>
            Track interview progress for {requisition.role} - {requisition.project}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Requisition Info */}
          <div className="grid grid-cols-2 gap-4 text-sm bg-muted/50 p-3 rounded-lg">
            <div>
              <Label className="text-muted-foreground text-xs">Requisition ID</Label>
              <p className="font-medium">{requisition.id}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Role</Label>
              <p className="font-medium">{requisition.role}</p>
            </div>
          </div>

          {/* Completed Rounds Display */}
          {state.rounds.filter(r => r.locked).length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Completed Rounds</Label>
              <div className="space-y-2">
                {state.rounds.filter(r => r.locked).map(round => (
                  <div 
                    key={round.level} 
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                  >
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{round.level} Interview</span>
                    </div>
                    <span className={cn(
                      "px-2 py-1 rounded text-xs font-semibold",
                      round.status === 'selected' && "bg-success-muted text-success-foreground",
                      round.status === 'rejected' && "bg-danger-muted text-danger-foreground",
                      round.status === 'hold' && "bg-warning-muted text-warning-foreground"
                    )}>
                      {round.status.charAt(0).toUpperCase() + round.status.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rejected State */}
          {state.isRejected && (
            <div className="p-4 rounded-lg bg-danger-muted border border-danger/40">
              <div className="flex items-center gap-2 text-danger-foreground">
                <XCircle className="h-5 w-5" />
                <span className="font-semibold">Candidate Rejected</span>
              </div>
              <p className="text-sm text-danger-foreground/80 mt-1">
                Interview flow has ended. Route to Offer is disabled.
              </p>
            </div>
          )}

          {/* Hold State */}
          {state.isOnHold && (
            <div className="p-4 rounded-lg bg-warning-muted border border-warning/40">
              <div className="flex items-center gap-2 text-warning-foreground">
                <Clock className="h-5 w-5" />
                <span className="font-semibold">Interview On Hold</span>
              </div>
              <p className="text-sm text-warning-foreground/80 mt-1">
                Progression to next interview round or offer is paused.
              </p>
            </div>
          )}

          {/* TAG Selection - Only show if not rejected or on hold */}
          {!state.isRejected && !state.isOnHold && !state.canRouteToOffer && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Select Interview Round (TAG)</Label>
              <RadioGroup 
                value={state.currentLevel || ''} 
                onValueChange={(value) => handleLevelSelect(value as InterviewLevel)}
                className="grid grid-cols-2 gap-3"
              >
                {interviewLevels.map((level) => {
                  const isLocked = state.rounds.some(r => r.level === level.value && r.locked)
                  const isAvailable = availableLevels.includes(level.value)
                  const isSelected = state.currentLevel === level.value

                  return (
                    <div 
                      key={level.value}
                      className={cn(
                        "flex items-center space-x-3 p-3 rounded-lg border transition-colors",
                        isLocked && "opacity-50 bg-muted cursor-not-allowed",
                        isAvailable && !isLocked && "hover:bg-muted/50 cursor-pointer",
                        !isAvailable && !isLocked && "opacity-40 cursor-not-allowed",
                        isSelected && "ring-2 ring-primary bg-primary/5"
                      )}
                    >
                      <RadioGroupItem 
                        value={level.value} 
                        id={level.value} 
                        disabled={isLocked || !isAvailable}
                      />
                      <Label 
                        htmlFor={level.value} 
                        className={cn(
                          "cursor-pointer flex-1",
                          (isLocked || !isAvailable) && "cursor-not-allowed"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {isLocked && <Lock className="h-3 w-3" />}
                          <Users className="h-4 w-4 text-primary" />
                          <span className="font-medium">{level.label}</span>
                        </div>
                      </Label>
                    </div>
                  )
                })}
              </RadioGroup>
            </div>
          )}

          {/* TAG Status Dropdown - Only show when a level is selected */}
          {state.currentLevel && !state.rounds.find(r => r.level === state.currentLevel)?.locked && !state.isRejected && !state.isOnHold && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold">TAG Status for {state.currentLevel} Interview</Label>
              <Select 
                value={currentTagStatus || ''} 
                onValueChange={(value) => handleTagStatusChange(value as TagStatus)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="selected">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      Selected
                    </div>
                  </SelectItem>
                  <SelectItem value="rejected">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-danger" />
                      Rejected
                    </div>
                  </SelectItem>
                  <SelectItem value="hold">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-warning" />
                      Hold
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Further Rounds Question - Only show when status is "Selected" */}
          {showFurtherRoundsQuestion && (
            <div className="space-y-3 p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
              <Label className="text-sm font-semibold">Are there further interview rounds?</Label>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => handleFurtherRoundsChange(true)}
                  className="flex-1"
                  disabled={state.currentLevel === 'L4'}
                >
                  Yes
                </Button>
                <Button 
                  variant="default" 
                  onClick={() => handleFurtherRoundsChange(false)}
                  className="flex-1"
                >
                  No (No Further Rounds)
                </Button>
              </div>
              {state.currentLevel === 'L4' && (
                <p className="text-xs text-muted-foreground">
                  L4 is the final interview level. Select "No Further Rounds" to proceed.
                </p>
              )}
            </div>
          )}

          {/* Ready to Route to Offer */}
          {state.canRouteToOffer && (
            <div className="p-4 rounded-lg bg-success-muted border border-success/40">
              <div className="flex items-center gap-2 text-success-foreground">
                <Gift className="h-5 w-5" />
                <span className="font-semibold">Ready for Offer</span>
              </div>
              <p className="text-sm text-success-foreground/80 mt-1">
                All interview rounds completed. You can now route this candidate to the offer stage.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {!state.canRouteToOffer && (
            <Button onClick={handleSave} disabled={state.isRejected && state.rounds.length === 0}>
              Save Progress
            </Button>
          )}
          {state.canRouteToOffer && (
            <Button 
              onClick={handleRouteToOffer}
              className="bg-success hover:bg-success/90 text-white"
            >
              <Gift className="h-4 w-4 mr-2" />
              Route to Offer
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
