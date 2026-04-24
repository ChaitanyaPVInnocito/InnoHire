import { supabase } from "@/integrations/supabase/client"

interface CreateNotificationParams {
  userId: string
  title: string
  body: string
  type?: "info" | "approval" | "approved" | "rejected" | "offer"
  metadata?: Record<string, any>
  /** Optional event category to check against user preferences */
  eventCategory?: NotificationEventCategory
}

export type NotificationEventCategory =
  | "requisition_submitted"
  | "requisition_approved"
  | "requisition_rejected"
  | "requisition_update"
  | "offer_routed"
  | "offer_approved"
  | "offer_rejected"
  | "re_initiation"

type NotificationPreferenceKey =
  | "browser_enabled"
  | "requisition_submitted"
  | "requisition_approved"
  | "requisition_rejected"
  | "requisition_update"
  | "offer_routed"
  | "offer_approved"
  | "offer_rejected"
  | "re_initiation"

/** Maps event categories to preference column names */
const eventToPreferenceKey: Record<NotificationEventCategory, NotificationPreferenceKey> = {
  requisition_submitted: "requisition_submitted",
  requisition_approved: "requisition_approved",
  requisition_rejected: "requisition_rejected",
  requisition_update: "requisition_update",
  offer_routed: "offer_routed",
  offer_approved: "offer_approved",
  offer_rejected: "offer_rejected",
  re_initiation: "re_initiation",
}

/**
 * Check if a user has opted in to receive in-app/browser notifications.
 * No preferences row means defaults are enabled.
 */
async function isNotificationEnabled(userId: string, eventCategory?: NotificationEventCategory): Promise<boolean> {
  const prefKey = eventCategory ? eventToPreferenceKey[eventCategory] : null
  const selectColumns = prefKey ? `browser_enabled, ${prefKey}` : "browser_enabled"

  const { data } = await supabase
    .from("notification_preferences")
    .select(selectColumns)
    .eq("user_id", userId)
    .maybeSingle()

  if (!data) return true

  const preferences = data as unknown as Partial<Record<NotificationPreferenceKey, boolean>>

  if (preferences.browser_enabled === false) {
    return false
  }

  if (prefKey && preferences[prefKey] === false) {
    return false
  }

  return true
}

export async function createNotification({
  userId,
  title,
  body,
  type = "info",
  metadata = {},
  eventCategory,
}: CreateNotificationParams) {
  const enabled = await isNotificationEnabled(userId, eventCategory)
  if (!enabled) return

  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    title,
    body,
    type,
    metadata,
  })

  if (error) {
    console.error("Failed to create notification:", error)
  }
}

/**
 * Send a notification to all users with a specific role,
 * respecting each user's notification preferences.
 */
export async function notifyUsersWithRole(
  role: "hiring-manager" | "lob-head" | "tag-manager",
  title: string,
  body: string,
  type: CreateNotificationParams["type"] = "info",
  metadata: Record<string, any> = {},
  eventCategory?: NotificationEventCategory
) {
  const { data: roleUsers } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("role", role as any)

  if (roleUsers) {
    for (const { user_id } of roleUsers) {
      await createNotification({
        userId: user_id,
        title,
        body,
        type,
        metadata,
        eventCategory,
      })
    }
  }
}
