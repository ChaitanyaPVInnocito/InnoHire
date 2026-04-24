import { FileEdit, Clock, CheckCircle, Users, Gift, XCircle, Pause } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type RequisitionStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'interview' | 'hold'

interface RequisitionLifecycleStepperProps {
  status: RequisitionStatus
  className?: string
}

const lifecycleStages = [
  { key: 'draft', label: 'Draft', icon: FileEdit },
  { key: 'pending', label: 'Pending', icon: Clock },
  { key: 'approved', label: 'Approved', icon: CheckCircle },
  { key: 'interview', label: 'Interview', icon: Users },
  { key: 'offer', label: 'Offer', icon: Gift },
]

const getStageIndex = (status: RequisitionStatus): number => {
  // Handle special statuses
  if (status === 'rejected' || status === 'hold') return -1
  
  const index = lifecycleStages.findIndex(s => s.key === status)
  return index
}

export function RequisitionLifecycleStepper({ status, className }: RequisitionLifecycleStepperProps) {
  const currentIndex = getStageIndex(status)
  const isRejected = status === 'rejected'
  const isHold = status === 'hold'

  // For rejected/hold statuses, show a special indicator
  if (isRejected) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn("flex items-center gap-1", className)}>
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-destructive/20">
                <XCircle className="h-4 w-4 text-destructive" />
              </div>
              <span className="text-xs text-destructive font-medium">Rejected</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>This requisition has been rejected</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  if (isHold) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn("flex items-center gap-1", className)}>
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-950">
                <Pause className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">On Hold</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>This requisition is temporarily on hold</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("flex items-center gap-0.5", className)}>
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
                        "w-3 h-0.5 mx-0.5",
                        index < currentIndex ? "bg-success" : "bg-muted"
                      )}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs">
            <p className="font-medium mb-1">Requisition Progress</p>
            <div className="flex flex-col gap-1">
              {lifecycleStages.map((stage, index) => {
                const isCompleted = index < currentIndex
                const isCurrent = index === currentIndex
                return (
                  <div 
                    key={stage.key} 
                    className={cn(
                      "flex items-center gap-2",
                      isCompleted && "text-success",
                      isCurrent && "text-primary font-medium",
                      !isCompleted && !isCurrent && "text-muted-foreground"
                    )}
                  >
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      isCompleted && "bg-success",
                      isCurrent && "bg-primary",
                      !isCompleted && !isCurrent && "bg-muted-foreground/30"
                    )} />
                    <span>{stage.label}</span>
                    {isCurrent && <span className="text-[10px]">(current)</span>}
                  </div>
                )
              })}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
