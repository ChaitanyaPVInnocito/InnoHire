
# Implementation Plan: Email Notifications, Visual Workflow Stepper, and Audit Logging

## Overview

This plan covers three interconnected features to enhance the InnoHire requisition workflow:

1. **Email Notifications** - Send emails when requisitions are routed between roles
2. **Visual Workflow Stepper** - Display requisition lifecycle progression visually
3. **Audit Logging** - Track all status changes with timestamps and user information

---

## Prerequisites

Before implementing these features, the following setup is required:

### Lovable Cloud Enablement
- Cloud must be enabled to use Supabase Edge Functions for sending emails via Resend
- This is required for the email notification feature

### Resend Integration
- Sign up at https://resend.com
- Verify your email domain at https://resend.com/domains
- Create an API key at https://resend.com/api-keys
- The `RESEND_API_KEY` will need to be stored as a secret

---

## Feature 1: Email Notifications

### Notification Triggers

| Event | Sender Role | Recipient | Email Content |
|-------|-------------|-----------|---------------|
| Requisition submitted | Hiring Manager | LOB Head | "New requisition pending your approval" |
| Requisition approved | LOB Head | Hiring Manager + TAG | "Your requisition has been approved" |
| Requisition rejected | LOB Head | Hiring Manager | "Your requisition was rejected" |
| Offer routed for approval | TAG | LOB Head | "New offer pending your approval" |
| Offer approved | LOB Head | TAG | "Offer approved, ready to send" |
| Offer rejected | LOB Head | TAG | "Offer was rejected" |

### Implementation Approach

1. **Create Edge Function**: `supabase/functions/send-notification-email/index.ts`
   - Accept email type, recipient, and context data
   - Use Resend to send formatted HTML emails
   - Include proper CORS headers for frontend calls

2. **Create Email Templates**: Professional HTML templates for each notification type
   - Consistent branding with InnoHire logo
   - Clear action descriptions and context
   - Links to relevant dashboard sections (when backend auth is implemented)

3. **Integrate with Existing Dialogs**:
   - Update `approval-review-dialog.tsx` to call email function on approve/reject
   - Update `requisition-table.tsx` to call email function on submit
   - Update `route-to-offer-dialog.tsx` to call email function when routing offers
   - Update `offer-approval-table.tsx` to call email function on offer decisions

4. **Create Notification Service**: `src/services/notification-service.ts`
   - Centralized function to invoke the edge function
   - Handle errors gracefully with fallback toast messages

---

## Feature 2: Visual Workflow Stepper for Requisitions

### Requisition Lifecycle Stages

```text
Draft --> Pending --> Approved --> Interview --> Offer
  |                      |
  v                      v
[Editable]            [Hold]
                         |
                         v
                     [Rejected]
```

### Visual Design

The stepper will display as a horizontal progress indicator with:
- **Circular icons** for each stage connected by lines
- **Color coding**:
  - Completed stages: Green with checkmark
  - Current stage: Primary blue with ring highlight
  - Future stages: Muted gray
  - Rejected/Hold: Red/Orange with X icon

### Implementation Approach

1. **Create Stepper Component**: `src/components/dashboard/requisition-lifecycle-stepper.tsx`
   - Reuse the pattern from the existing `OfferLifecycleStepper` in `offer-approval-table.tsx`
   - Define stages: Draft, Pending, Approved, Interview, Offer
   - Handle special states: Hold (orange), Rejected (red)

2. **Add "Progress" Column to Requisition Table**:
   - Update `requisition-table.tsx` to include the new stepper
   - Position between Status and Actions columns
   - Add tooltip on hover showing stage details

3. **Stepper Configuration**:
```text
const requisitionStages = [
  { key: 'draft', label: 'Draft', icon: FileEdit },
  { key: 'pending', label: 'Pending', icon: Clock },
  { key: 'approved', label: 'Approved', icon: CheckCircle },
  { key: 'interview', label: 'Interview', icon: Users },
  { key: 'offer', label: 'Offer', icon: Gift },
]
```

---

## Feature 3: Audit Logging for Status Changes

### Data Structure

Each audit log entry will capture:
- `id`: Unique identifier
- `requisitionId`: Reference to the requisition
- `previousStatus`: Status before the change
- `newStatus`: Status after the change
- `changedBy`: User who made the change (role + name)
- `changedAt`: Timestamp of the change
- `notes`: Optional notes/comments provided during the action

### Implementation Approach (Client-Side for Now)

Since there's no database connected yet, we'll implement client-side audit logging that can be easily migrated to Supabase later:

1. **Create Audit Log Types**: `src/types/audit.ts`
   - Define `AuditLogEntry` interface
   - Define helper functions for creating entries

2. **Create Audit Context/State**: `src/contexts/audit-context.tsx`
   - Store audit logs in React state
   - Provide methods to add log entries
   - Persist to localStorage for demo purposes

3. **Integrate with Status Change Points**:
   - Update `requisition-table.tsx` - log on submit
   - Update `approval-review-dialog.tsx` - log on approve/reject
   - Update `tag-status-dialog.tsx` - log on interview/hold updates

4. **Create Audit Log Viewer**: `src/components/dashboard/audit-log-viewer.tsx`
   - Dialog component to view audit history for a requisition
   - Timeline view showing all status changes
   - Filter by date range or action type

5. **Add "View History" Action**:
   - Add history icon button in requisition table actions
   - Opens audit log viewer dialog for that requisition

### Future Database Migration

When Supabase is connected, the audit log can be migrated to:
- A dedicated `audit_logs` table
- RLS policies to control who can view audit data
- Edge function for server-side logging

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/send-notification-email/index.ts` | Edge function for sending emails |
| `src/services/notification-service.ts` | Frontend service to call email function |
| `src/components/dashboard/requisition-lifecycle-stepper.tsx` | Visual stepper component |
| `src/types/audit.ts` | Audit log type definitions |
| `src/contexts/audit-context.tsx` | Audit log state management |
| `src/components/dashboard/audit-log-viewer.tsx` | Audit history dialog |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/requisition-table.tsx` | Add stepper column, audit logging, email triggers |
| `src/components/dashboard/approval-review-dialog.tsx` | Add audit logging, email triggers |
| `src/components/dashboard/tag-status-dialog.tsx` | Add audit logging |
| `src/components/dashboard/route-to-offer-dialog.tsx` | Add email trigger |
| `src/components/dashboard/offer-approval-table.tsx` | Add email triggers |
| `src/pages/Dashboard.tsx` | Wrap with AuditProvider |
| `supabase/config.toml` | Configure edge function |

---

## Technical Notes

### Email Edge Function Structure

The edge function will:
1. Accept POST requests with notification type and data
2. Validate required fields
3. Build HTML email using templates
4. Send via Resend API
5. Return success/error response with CORS headers

### Stepper Design Consistency

The requisition stepper will follow the same visual pattern as the existing offer lifecycle stepper to maintain UI consistency across the application.

### Audit Log Scalability

The client-side implementation uses localStorage for persistence, making it suitable for demo/development. The data structure is designed to map directly to a future Supabase table without requiring refactoring.

---

## Implementation Order

1. **Phase 1**: Visual Workflow Stepper (no external dependencies)
2. **Phase 2**: Audit Logging (client-side, no external dependencies)
3. **Phase 3**: Email Notifications (requires Cloud + Resend setup)

This order allows immediate visual improvements while the backend prerequisites are set up.
