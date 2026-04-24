import { useState, useRef, useCallback } from "react"
import { Bell, Check, CheckCheck, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useNotifications, type Notification } from "@/hooks/use-notifications"
import { useNotificationPreferences } from "@/hooks/use-notification-preferences"
import { formatDistanceToNow } from "date-fns"

const typeStyles: Record<string, string> = {
  approval: "bg-warning/10 border-l-warning",
  approved: "bg-success/10 border-l-success",
  rejected: "bg-destructive/10 border-l-destructive",
  offer: "bg-primary/10 border-l-primary",
  info: "bg-muted border-l-muted-foreground",
}

const SWIPE_THRESHOLD = 80

function NotificationItem({
  notification,
  onMarkRead,
  onDismiss,
}: {
  notification: Notification
  onMarkRead: (id: string) => void
  onDismiss: (id: string) => void
}) {
  const typeStyle = typeStyles[notification.type] || typeStyles.info
  const startX = useRef(0)
  const currentX = useRef(0)
  const itemRef = useRef<HTMLDivElement>(null)
  const swiping = useRef(false)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
    currentX.current = 0
    swiping.current = true
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swiping.current || !itemRef.current) return
    const diff = e.touches[0].clientX - startX.current
    // Only allow swiping left (negative)
    const offset = Math.min(0, diff)
    currentX.current = offset
    itemRef.current.style.transform = `translateX(${offset}px)`
    itemRef.current.style.opacity = `${1 - Math.abs(offset) / (SWIPE_THRESHOLD * 2)}`
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (!swiping.current || !itemRef.current) return
    swiping.current = false

    if (Math.abs(currentX.current) >= SWIPE_THRESHOLD) {
      // Animate out then dismiss
      itemRef.current.style.transition = "transform 0.2s ease, opacity 0.2s ease"
      itemRef.current.style.transform = "translateX(-100%)"
      itemRef.current.style.opacity = "0"
      setTimeout(() => onDismiss(notification.id), 200)
    } else {
      // Snap back
      itemRef.current.style.transition = "transform 0.2s ease, opacity 0.2s ease"
      itemRef.current.style.transform = "translateX(0)"
      itemRef.current.style.opacity = "1"
      setTimeout(() => {
        if (itemRef.current) {
          itemRef.current.style.transition = ""
        }
      }, 200)
    }
  }, [notification.id, onDismiss])

  return (
    <div
      ref={itemRef}
      className={cn(
        "px-3 py-2.5 border-l-4 rounded-r-md transition-colors cursor-pointer touch-pan-y",
        typeStyle,
        notification.read ? "opacity-60" : "opacity-100"
      )}
      onClick={() => !notification.read && onMarkRead(notification.id)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm leading-tight", !notification.read && "font-semibold")}>
            {notification.title}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {notification.body}
          </p>
          <p className="text-[10px] text-muted-foreground/70 mt-1">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </p>
        </div>
        {!notification.read && (
          <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
        )}
      </div>
    </div>
  )
}

export function NotificationBell() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    dismissNotification,
    requestPushPermission,
  } = useNotifications()
  const { preferences, refetch: refetchPrefs, updatePreference } = useNotificationPreferences()
  const [open, setOpen] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const browserEnabled = preferences.browser_enabled

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen) {
      refetchPrefs()
    }
  }

  const handleEnablePush = async () => {
    const result = await requestPushPermission()
    if (result === "granted") {
      await updatePreference("browser_enabled", true)
    }
  }

  const handleDisableBanner = () => {
    setDismissed(true)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 flex items-center justify-center text-[10px] bg-destructive text-destructive-foreground border-2 border-card"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 sm:w-96 p-0"
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-sm">Notifications</h3>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={markAllAsRead}
              >
                <CheckCheck className="h-3 w-3" />
                Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                onClick={clearAll}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Push notification status banner */}
        {"Notification" in (typeof window !== "undefined" ? window : {}) && (
          browserEnabled ? (
            <div className="px-4 py-2 bg-success/5 border-b border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Browser notifications</span>
              <span className="text-xs font-medium text-success">Enabled</span>
            </div>
          ) : dismissed ? (
            <div className="px-4 py-2 bg-muted/50 border-b border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Browser notifications</span>
              <span className="text-xs font-medium text-destructive">Disabled</span>
            </div>
          ) : (
            <div className="px-4 py-2 bg-primary/5 border-b border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Enable browser notifications?</span>
              <div className="flex gap-1">
                <Button size="sm" variant="default" className="h-6 text-xs px-2" onClick={handleEnablePush}>
                  Enable
                </Button>
                <Button size="sm" variant="ghost" className="h-6 text-xs px-1" onClick={handleDisableBanner}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )
        )}

        {/* Swipe hint for mobile */}
        {notifications.length > 0 && (
          <div className="block sm:hidden px-4 py-1 bg-muted/50">
            <p className="text-[10px] text-muted-foreground text-center">Swipe left to dismiss</p>
          </div>
        )}

        {/* Notification list */}
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="py-8 text-center">
              <Bell className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-0.5 p-2 overflow-hidden">
              {notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onMarkRead={markAsRead}
                  onDismiss={dismissNotification}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
