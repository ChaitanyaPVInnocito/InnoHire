import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-smooth border",
  {
    variants: {
      variant: {
        pending: "bg-warning-muted text-warning-foreground border-warning/40",
        approved: "bg-success-muted text-success-foreground border-success/40",
        rejected: "bg-danger-muted text-danger-foreground border-danger/40",
        interview: "bg-info-muted text-info-foreground border-info/40",
        "in-progress": "bg-info-muted text-info-foreground border-info/40",
        draft: "bg-muted text-muted-foreground border-border",
        delayed: "bg-warning-muted text-warning-foreground border-warning/40",
        "no-show": "bg-muted text-muted-foreground border-border",
        hold: "bg-orange-200 text-orange-800 border-orange-400/50 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-700"
      }
    },
    defaultVariants: {
      variant: "pending"
    }
  }
)

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {
  children: React.ReactNode
}

export function StatusBadge({ className, variant, children, ...props }: StatusBadgeProps) {
  return (
    <div className={cn(statusBadgeVariants({ variant }), className)} {...props}>
      {children}
    </div>
  )
}