import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Users, CheckCircle, XCircle, Clock, Gift, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Candidate, CandidateInterviewState, InterviewLevel, TagStatus } from "@/types/candidate"
import { getDefaultInterviewState, interviewLevels, getNextLevel } from "@/types/candidate"

interface Requisition {
  id: string
  role: string
  project: string
}

interface CandidateInterviewDialogProps {
  candidate: Candidate | null
  requisition: Requisition | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdateInterview: (candidateId: string, state: CandidateInterviewState) => void
  onRouteToOffer: (candidate: Candidate) => void
}

export function CandidateInterviewDialog({
  candidate,
  requisition,
  open,
  onOpenChange,
  onUpdateInterview,
  onRouteToOffer
}: CandidateInterviewDialogProps) {
  const [state, setState] = useState<CandidateInterviewState>(getDefaultInterviewState())
  const [currentTagStatus, setCurrentTagStatus] = useState<TagStatus | null>(null)

  useEffect(() => {
    if (candidate?.interviewState) {
      setState(candidate.interviewState)
      const activeRound = candidate.interviewState.currentLevel
        ? candidate.interviewState.rounds.find(
            (round) => round.level === candidate.interviewState.currentLevel && !round.locked
          )
        : candidate.interviewState.rounds.find((round) => !round.locked)
      setCurrentTagStatus(activeRound?.status ?? null)
    } else {
      setState(getDefaultInterviewState())
      setCurrentTagStatus(null)
    }
  }, [candidate, open])

  const persistInterviewState = (nextState: CandidateInterviewState) => {
    if (candidate) {
      onUpdateInterview(candidate.id, nextState)
    }
  }

  const handleLevelSelect = (level: InterviewLevel) => {
    if (state.isRejected || state.isOnHold) return

    const existingRound = state.rounds.find((round) => round.level === level)
    if (existingRound?.locked) return

    const lockedRounds = state.rounds.filter((round) => round.locked)
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
      toast.error('You must start with L1 Interview')
      return
    }

    const nextState: CandidateInterviewState = {
      ...state,
      currentLevel: level,
      rounds: state.rounds.some((round) => round.level === level)
        ? state.rounds
        : [...state.rounds, { level, status: 'selected', locked: false }],
    }

    setState(nextState)
    setCurrentTagStatus(existingRound?.status ?? null)
    persistInterviewState(nextState)
  }

  const handleTagStatusChange = (status: TagStatus) => {
    setCurrentTagStatus(status)

    const updatedRounds = state.rounds.map((round) =>
      round.level === state.currentLevel ? { ...round, status } : round
    )

    const nextState: CandidateInterviewState = status === 'rejected'
      ? {
          ...state,
          rounds: updatedRounds,
          isRejected: true,
          isOnHold: false,
          hasFurtherRounds: null,
          canRouteToOffer: false,
        }
      : status === 'hold'
        ? {
            ...state,
            rounds: updatedRounds,
            isOnHold: true,
            isRejected: false,
            hasFurtherRounds: null,
            canRouteToOffer: false,
          }
        : {
            ...state,
            rounds: updatedRounds,
            isRejected: false,
            isOnHold: false,
            hasFurtherRounds: null,
            canRouteToOffer: false,
          }

    setState(nextState)
    persistInterviewState(nextState)
  }

  const handleFurtherRoundsChange = (hasFurther: boolean) => {
    if (hasFurther) {
      const nextLevel = state.currentLevel ? getNextLevel(state.currentLevel) : null

      if (!nextLevel) {
        toast.error('No more interview levels available. Select "No Further Rounds" to proceed.')
        return
      }

      const nextState: CandidateInterviewState = {
        ...state,
        rounds: state.rounds.map((round) =>
          round.level === state.currentLevel ? { ...round, locked: true } : round
        ),
        hasFurtherRounds: true,
        currentLevel: null,
        canRouteToOffer: false,
      }

      setState(nextState)
      setCurrentTagStatus(null)
      persistInterviewState(nextState)
      return
    }

    const nextState: CandidateInterviewState = {
      ...state,
      hasFurtherRounds: false,
      canRouteToOffer: true,
      rounds: state.rounds.map((round) =>
        round.level === state.currentLevel ? { ...round, locked: true } : round
      ),
    }

    setState(nextState)
    persistInterviewState(nextState)
  }

  const handleSave = () => {
    if (candidate) {
      persistInterviewState(state)
      toast.success(`Interview progress saved for ${candidate.name}`)
      onOpenChange(false)
    }
  }

  const handleRouteCandidateToOffer = () => {
    if (candidate && state.canRouteToOffer) {
      const finalState: CandidateInterviewState = {
        ...state,
        rounds: state.rounds.map((round) => ({ ...round, locked: true })),
      }
      persistInterviewState(finalState)
      onRouteToOffer({ ...candidate, interviewState: finalState })
    }
  }

  const getAvailableLevels = () => {
    const lockedRounds = state.rounds.filter((round) => round.locked)
    if (lockedRounds.length === 0) {
      return ['L1'] as InterviewLevel[]
    }
    const lastLocked = lockedRounds[lockedRounds.length - 1].level
    const next = getNextLevel(lastLocked)
    return next ? [next] : []
  }

  const availableLevels = getAvailableLevels()
  const showFurtherRoundsQuestion = currentTagStatus === 'selected' && state.hasFurtherRounds === null

  if (!candidate || !requisition) return null

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          setState(getDefaultInterviewState())
          setCurrentTagStatus(null)
        }
        onOpenChange(isOpen)
      }}
    >
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Manage Interview Rounds</DialogTitle>
          <DialogDescription>
            {candidate.name} - {requisition.role}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-6 overflow-y-auto py-4 pr-2">
          <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/50 p-3 text-sm">
            <div>
              <Label className="text-xs text-muted-foreground">Candidate</Label>
              <p className="font-medium">{candidate.name}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Requisition</Label>
              <p className="font-medium">{requisition.id}</p>
            </div>
          </div>

          {state.rounds.filter((round) => round.locked).length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Completed Rounds</Label>
              <div className="space-y-2">
                {state.rounds.filter((round) => round.locked).map((round) => (
                  <div
                    key={round.level}
                    className="flex items-center justify-between rounded-lg border bg-muted/30 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{round.level} Interview</span>
                    </div>
                    <span
                      className={cn(
                        "rounded px-2 py-1 text-xs font-semibold",
                        round.status === 'selected' && "bg-success-muted text-success-foreground",
                        round.status === 'rejected' && "bg-danger-muted text-danger-foreground",
                        round.status === 'hold' && "bg-warning-muted text-warning-foreground"
                      )}
                    >
                      {round.status.charAt(0).toUpperCase() + round.status.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {state.isRejected && (
            <div className="rounded-lg border border-danger/40 bg-danger-muted p-4">
              <div className="flex items-center gap-2 text-danger-foreground">
                <XCircle className="h-5 w-5" />
                <span className="font-semibold">Candidate Rejected</span>
              </div>
              <p className="mt-1 text-sm text-danger-foreground/80">
                Interview flow has ended. Route to Offer is disabled.
              </p>
            </div>
          )}

          {state.isOnHold && (
            <div className="rounded-lg border border-warning/40 bg-warning-muted p-4">
              <div className="flex items-center gap-2 text-warning-foreground">
                <Clock className="h-5 w-5" />
                <span className="font-semibold">Interview On Hold</span>
              </div>
              <p className="mt-1 text-sm text-warning-foreground/80">
                Progression to next interview round or offer is paused.
              </p>
            </div>
          )}

          {!state.isRejected && !state.isOnHold && !state.canRouteToOffer && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Select Interview Round</Label>
              <RadioGroup
                value={state.currentLevel || ''}
                onValueChange={(value) => handleLevelSelect(value as InterviewLevel)}
                className="grid grid-cols-2 gap-3"
              >
                {interviewLevels.map((level) => {
                  const isLocked = state.rounds.some((round) => round.level === level.value && round.locked)
                  const isAvailable = availableLevels.includes(level.value)
                  const isSelected = state.currentLevel === level.value

                  return (
                    <div
                      key={level.value}
                      className={cn(
                        "flex items-center space-x-3 rounded-lg border p-3 transition-colors",
                        isLocked && "cursor-not-allowed bg-muted opacity-50",
                        isAvailable && !isLocked && "cursor-pointer hover:bg-muted/50",
                        !isAvailable && !isLocked && "cursor-not-allowed opacity-40",
                        isSelected && "bg-primary/5 ring-2 ring-primary"
                      )}
                    >
                      <RadioGroupItem
                        value={level.value}
                        id={`${candidate.id}-${level.value}`}
                        disabled={isLocked || !isAvailable}
                      />
                      <Label
                        htmlFor={`${candidate.id}-${level.value}`}
                        className={cn(
                          "flex-1 cursor-pointer",
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

          {state.currentLevel && !state.rounds.find((round) => round.level === state.currentLevel)?.locked && !state.isRejected && !state.isOnHold && (
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

          {showFurtherRoundsQuestion && (
            <div className="space-y-3 rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
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

          {state.canRouteToOffer && (
            <div className="rounded-lg border border-success/40 bg-success-muted p-4">
              <div className="flex items-center gap-2 text-success-foreground">
                <Gift className="h-5 w-5" />
                <span className="font-semibold">Ready for Offer</span>
              </div>
              <p className="mt-1 text-sm text-success-foreground/80">
                All interview rounds completed. You can now route this candidate to the offer stage.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">Progress saves automatically.</p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {!state.canRouteToOffer && (
              <Button onClick={handleSave} disabled={state.isRejected && state.rounds.length === 0}>
                Done
              </Button>
            )}
            {state.canRouteToOffer && (
              <Button
                onClick={handleRouteCandidateToOffer}
                className="bg-success text-success-foreground hover:bg-success/90"
              >
                <Gift className="mr-2 h-4 w-4" />
                Route to Offer
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
