import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/auth-context"

export interface Notification {
  id: string
  user_id: string
  title: string
  body: string
  type: string
  read: boolean
  metadata: Record<string, any>
  created_at: string
}

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const unreadCount = notifications.filter(n => !n.read).length

  const fetchNotifications = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)

    if (data) {
      setNotifications(data as unknown as Notification[])
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Realtime subscription
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = payload.new as unknown as Notification
          setNotifications(prev => [newNotif, ...prev])

          // Trigger browser notification if permission granted
          if (Notification.permission === "granted") {
            new window.Notification(newNotif.title, {
              body: newNotif.body,
              icon: "/favicon.ico",
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const markAsRead = useCallback(async (id: string) => {
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id)

    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    )
  }, [])

  const markAllAsRead = useCallback(async () => {
    if (!user) return
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false)

    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [user])

  const clearAll = useCallback(async () => {
    if (!user) return
    await supabase
      .from("notifications")
      .delete()
      .eq("user_id", user.id)

    setNotifications([])
  }, [user])

  const dismissNotification = useCallback(async (id: string) => {
    await supabase
      .from("notifications")
      .delete()
      .eq("id", id)

    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const requestPushPermission = useCallback(async () => {
    if (!("Notification" in window)) return "unsupported"
    const permission = await window.Notification.requestPermission()
    if (permission === "granted" && user) {
      // Store subscription info if available
      if ("serviceWorker" in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: undefined, // VAPID key would go here for full push
          })
          // Save push subscription
          const sub = subscription.toJSON()
          await supabase.from("push_subscriptions").upsert({
            user_id: user.id,
            endpoint: sub.endpoint!,
            keys: sub.keys as any,
          }, { onConflict: "user_id,endpoint" })
        } catch (e) {
          console.log("Push subscription not available:", e)
        }
      }
    }
    return permission
  }, [user])

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    clearAll,
    dismissNotification,
    requestPushPermission,
    refetch: fetchNotifications,
  }
}
