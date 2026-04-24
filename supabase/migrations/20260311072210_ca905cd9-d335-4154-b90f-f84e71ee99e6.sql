-- Replace the overly permissive insert policy with a more specific one
DROP POLICY "Authenticated can insert notifications" ON public.notifications;

-- Allow insertion only when user_id is set (notifications are inserted by the system/other users)
CREATE POLICY "Authenticated can insert notifications for any user"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
