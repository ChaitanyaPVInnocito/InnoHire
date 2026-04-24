import { useState, useEffect, useCallback } from "react"
import { apiClient } from "@/api/client"
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
    try {
      const response = await apiClient.get(`/notifications/user/${user.id}`)
      if (response.data) {
        setNotifications(response.data as Notification[])
      }
    } catch(err) {
      console.error("Failed to fetch notifications")
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Realtime subscription skipped locally, fall back to polling if needed
  useEffect(() => {
    if (!user) return

    const interval = setInterval(() => {
      fetchNotifications()
    }, 15000); // 15 seconds polling as temp fix for no websockets

    return () => clearInterval(interval)
  }, [user, fetchNotifications])

  const markAsRead = useCallback(async (id: string) => {
    try {
      await apiClient.put(`/notifications/${id}/read`)
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      )
    } catch(err) {
      console.error(err)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    if (!user) return
    try {
      await apiClient.put(`/notifications/user/${user.id}/read-all`)
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch(err) {
      console.error(err)
    }
  }, [user])

  const clearAll = useCallback(async () => {
    if (!user) return
    try {
      await apiClient.delete(`/notifications/user/${user.id}`)
      setNotifications([])
    } catch(err) {
      console.error(err);
    }
  }, [user])

  const dismissNotification = useCallback(async (id: string) => {
    try {
      await apiClient.delete(`/notifications/${id}`)
      setNotifications(prev => prev.filter(n => n.id !== id))
    } catch(err) {
      console.error(err);
    }
  }, [])

  const requestPushPermission = useCallback(async () => {
    if (!("Notification" in window)) return "unsupported"
    const permission = await window.Notification.requestPermission()
    if (permission === "granted" && user) {
      if ("serviceWorker" in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: undefined,
          })
          const sub = subscription.toJSON()
          await apiClient.post('/push-subscriptions', {
            userId: user.id,
            endpoint: sub.endpoint!,
            keys: sub.keys
          })
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
