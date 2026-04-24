import { supabase } from "@/integrations/supabase/client"

export type NotificationType = 
  | 'requisition_submitted'
  | 'requisition_approved'
  | 'requisition_rejected'
  | 'requisition_update'
  | 'offer_routed'
  | 'offer_approved'
  | 'offer_rejected'
  | 're_initiation_requested'
  | 're_initiation_approved'
  | 're_initiation_rejected'

interface NotificationData {
  type: NotificationType
  recipientEmail: string
  recipientName: string
  senderName: string
  requisitionId?: string
  role?: string
  project?: string
  candidateName?: string
  reason?: string
  comments?: string
  status?: string
}

export async function sendNotificationEmail(data: NotificationData): Promise<boolean> {
  try {
    const { error } = await supabase.functions.invoke('send-notification-email', {
      body: data,
    })

    if (error) {
      console.error('Failed to send notification email:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Failed to send email notification:', error)
    return false
  }
}

export function getRoleDisplayName(role: string): string {
  switch (role) {
    case 'hiring-manager':
      return 'Hiring Manager'
    case 'lob-head':
      return 'LOB Head'
    case 'tag-manager':
      return 'TAG Manager'
    default:
      return role
  }
}
