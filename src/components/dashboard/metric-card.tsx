import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
}

export function MetricCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend,
  variant = 'default'
}: MetricCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-primary text-primary-foreground'
      case 'success':
        return 'bg-gradient-success text-success-foreground'
      case 'warning':
        return 'bg-warning text-warning-foreground'
      case 'danger':
        return 'bg-danger text-danger-foreground'
      default:
        return ''
    }
  }

  return (
    <Card className={cn(
      "transition-smooth hover:shadow-elevated",
      getVariantStyles()
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className={cn(
          "text-sm font-medium",
          variant !== 'default' ? 'text-inherit' : 'text-foreground'
        )}>
          {title}
        </CardTitle>
        <Icon className={cn(
          "h-4 w-4",
          variant !== 'default' ? 'text-inherit opacity-80' : 'text-muted-foreground'
        )} />
      </CardHeader>
      <CardContent>
        <div className={cn(
          "text-2xl font-bold",
          variant !== 'default' ? 'text-inherit' : 'text-foreground'
        )}>
          {value}
        </div>
        {description && (
          <p className={cn(
            "mt-1 text-xs font-bold",
            variant !== 'default' ? 'text-inherit' : 'text-foreground/80'
          )}>
            {description}
          </p>
        )}
        {trend && (
          <div className={cn(
            "mt-2 flex items-center text-xs font-semibold",
            variant !== 'default'
              ? 'text-inherit'
              : trend.isPositive
                ? 'text-success'
                : 'text-danger'
          )}>
            <span className="mr-1">
              {trend.isPositive ? '↗' : '↘'}
            </span>
            {Math.abs(trend.value)}% from last month
          </div>
        )}
      </CardContent>
    </Card>
  )
}