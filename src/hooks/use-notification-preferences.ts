import { useState, useEffect, useCallback } from "react"
import { apiClient } from "@/api/client"
import { useAuth } from "@/contexts/auth-context"

export interface NotificationPreferences {
  email_enabled: boolean
  browser_enabled: boolean
  requisition_submitted: boolean
  requisition_approved: boolean
  requisition_rejected: boolean
  requisition_update: boolean
  offer_routed: boolean
  offer_approved: boolean
  offer_rejected: boolean
  re_initiation: boolean
}

const defaults: NotificationPreferences = {
  email_enabled: true,
  browser_enabled: true,
  requisition_submitted: true,
  requisition_approved: true,
  requisition_rejected: true,
  requisition_update: true,
  offer_routed: true,
  offer_approved: true,
  offer_rejected: true,
  re_initiation: true,
}

export function useNotificationPreferences() {
  const { user } = useAuth()
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaults)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchPreferences = useCallback(async () => {
    if (!user) return
    try {
      const response = await apiClient.get('/notification-preferences/me')
      if (response.data) {
        const { id, user_id, created_at, updated_at, ...prefs } = response.data
        setPreferences(prefs as NotificationPreferences)
      }
    } catch (error) {
      console.error('Failed to fetch notification preferences')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchPreferences()
  }, [fetchPreferences])

  const updatePreference = useCallback(
    async <K extends keyof NotificationPreferences>(key: K, value: NotificationPreferences[K]) => {
      if (!user) return
      const updated = { ...preferences, [key]: value }
      setPreferences(updated)
      setSaving(true)

      try {
        await apiClient.put('/notification-preferences/me', updated)
      } catch (error) {
        console.error('Failed to update preference')
      } finally {
        setSaving(false)
      }
    },
    [user, preferences]
  )

  return { preferences, loading, saving, updatePreference, refetch: fetchPreferences }
}
