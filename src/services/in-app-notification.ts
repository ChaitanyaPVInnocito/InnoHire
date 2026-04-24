import { apiClient } from "@/api/client"

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

export async function createNotification({
  userId,
  title,
  body,
  type = "info",
  metadata = {},
  eventCategory,
}: CreateNotificationParams) {

  try {
     await apiClient.post('/notifications', {
        userId,
        title,
        body,
        type,
        metadata
     })
  } catch(err) {
     console.error("Failed creating notification", err)
  }
}

export async function notifyUsersWithRole(
  role: "hiring-manager" | "lob-head" | "tag-manager",
  title: string,
  body: string,
  type: CreateNotificationParams["type"] = "info",
  metadata: Record<string, any> = {},
  eventCategory?: NotificationEventCategory
) {
  try {
    // Rely on Spring Boot implementation: Profiles might have roles
    // Normally Spring Boot would expose a `/notifications/role/{role}`
    // We will do a generic post and assuming backend parses user lists, but here we fallback to simple logging for migration purposes.
    const response = await apiClient.get('/profiles')
    const roleUsers = response.data.filter((p: any) => p.roles && p.roles.includes(role))

    for (const user of roleUsers) {
      await createNotification({
        userId: user.id,
        title,
        body,
        type,
        metadata,
        eventCategory
      })
    }
  } catch(err) {
     console.error("Failed notifying role", err)
  }
}
