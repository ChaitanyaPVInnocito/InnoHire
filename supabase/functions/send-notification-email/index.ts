import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const emailTemplates: Record<string, (data: any) => { subject: string; html: string }> = {
  requisition_submitted: (data) => ({
    subject: `Requisition ${data.requisitionId} - Pending Approval`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px;">
        <h2 style="color:#1a1a1a;">Requisition Submitted for Approval</h2>
        <p style="color:#444;line-height:1.6;"><strong>${data.senderName}</strong> has submitted requisition <strong>${data.requisitionId}</strong> for your review.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#888;">Role</td><td style="padding:8px;border-bottom:1px solid #eee;">${data.role || 'N/A'}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#888;">Project</td><td style="padding:8px;border-bottom:1px solid #eee;">${data.project || 'N/A'}</td></tr>
        </table>
        <p style="color:#444;">Please log in to InnoHire to review and approve/reject this requisition.</p>
      </div>
    `,
  }),
  requisition_approved: (data) => ({
    subject: `Requisition ${data.requisitionId} - Approved`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px;">
        <h2 style="color:#16a34a;">Requisition Approved ✓</h2>
        <p style="color:#444;line-height:1.6;">Requisition <strong>${data.requisitionId}</strong> has been approved by <strong>${data.senderName}</strong>.</p>
        ${data.comments ? `<p style="color:#444;background:#f5f5f5;padding:12px;border-radius:6px;margin:16px 0;"><em>"${data.comments}"</em></p>` : ''}
        <p style="color:#444;">The requisition is now in the interview stage.</p>
      </div>
    `,
  }),
  requisition_rejected: (data) => ({
    subject: `Requisition ${data.requisitionId} - Rejected`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px;">
        <h2 style="color:#dc2626;">Requisition Rejected</h2>
        <p style="color:#444;line-height:1.6;">Requisition <strong>${data.requisitionId}</strong> has been rejected by <strong>${data.senderName}</strong>.</p>
        ${data.comments ? `<p style="color:#444;background:#f5f5f5;padding:12px;border-radius:6px;margin:16px 0;"><em>"${data.comments}"</em></p>` : ''}
        <p style="color:#444;">Please review the feedback and make necessary adjustments.</p>
      </div>
    `,
  }),
  offer_routed: (data) => ({
    subject: `Offer Approval Required - ${data.candidateName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px;">
        <h2 style="color:#1a1a1a;">Offer Routed for Approval</h2>
        <p style="color:#444;line-height:1.6;">An offer for <strong>${data.candidateName}</strong> (${data.role || 'N/A'}) has been routed for your approval by <strong>${data.senderName}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#888;">Project</td><td style="padding:8px;border-bottom:1px solid #eee;">${data.project || 'N/A'}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#888;">Requisition</td><td style="padding:8px;border-bottom:1px solid #eee;">${data.requisitionId || 'N/A'}</td></tr>
        </table>
        ${data.comments ? `<p style="color:#444;background:#f5f5f5;padding:12px;border-radius:6px;"><em>"${data.comments}"</em></p>` : ''}
        <p style="color:#444;">Please log in to InnoHire to review this offer.</p>
      </div>
    `,
  }),
  offer_approved: (data) => ({
    subject: `Offer Approved - ${data.candidateName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px;">
        <h2 style="color:#16a34a;">Offer Approved ✓</h2>
        <p style="color:#444;line-height:1.6;">The offer for <strong>${data.candidateName}</strong> has been approved by <strong>${data.senderName}</strong>.</p>
        <p style="color:#444;">You may now proceed with releasing the offer to the candidate.</p>
      </div>
    `,
  }),
  offer_rejected: (data) => ({
    subject: `Offer Rejected - ${data.candidateName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px;">
        <h2 style="color:#dc2626;">Offer Rejected</h2>
        <p style="color:#444;line-height:1.6;">The offer for <strong>${data.candidateName}</strong> has been rejected by <strong>${data.senderName}</strong>.</p>
        ${data.reason ? `<p style="color:#444;background:#f5f5f5;padding:12px;border-radius:6px;"><em>"${data.reason}"</em></p>` : ''}
      </div>
    `,
  }),
  re_initiation_requested: (data) => ({
    subject: `Re-Initiation Request - ${data.requisitionId}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px;">
        <h2 style="color:#1a1a1a;">Re-Initiation Requested</h2>
        <p style="color:#444;line-height:1.6;">A re-initiation has been requested for requisition <strong>${data.requisitionId}</strong> by <strong>${data.senderName}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#888;">Candidate</td><td style="padding:8px;border-bottom:1px solid #eee;">${data.candidateName || 'N/A'}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#888;">Reason</td><td style="padding:8px;border-bottom:1px solid #eee;">${data.reason || 'N/A'}</td></tr>
        </table>
        <p style="color:#444;">Please log in to InnoHire to review this request.</p>
      </div>
    `,
  }),
  re_initiation_approved: (data) => ({
    subject: `Re-Initiation Approved - ${data.requisitionId}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px;">
        <h2 style="color:#16a34a;">Re-Initiation Approved ✓</h2>
        <p style="color:#444;line-height:1.6;">Re-initiation for requisition <strong>${data.requisitionId}</strong> has been approved by <strong>${data.senderName}</strong>.</p>
        ${data.comments ? `<p style="color:#444;background:#f5f5f5;padding:12px;border-radius:6px;"><em>"${data.comments}"</em></p>` : ''}
      </div>
    `,
  }),
  re_initiation_rejected: (data) => ({
    subject: `Re-Initiation Rejected - ${data.requisitionId}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px;">
        <h2 style="color:#dc2626;">Re-Initiation Rejected</h2>
        <p style="color:#444;line-height:1.6;">Re-initiation for requisition <strong>${data.requisitionId}</strong> has been rejected by <strong>${data.senderName}</strong>.</p>
        ${data.comments ? `<p style="color:#444;background:#f5f5f5;padding:12px;border-radius:6px;"><em>"${data.comments}"</em></p>` : ''}
      </div>
    `,
  }),
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await req.json();
    const { type, recipientEmail } = data;

    const template = emailTemplates[type];
    if (!template) {
      return new Response(
        JSON.stringify({ error: `Unknown notification type: ${type}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { subject, html } = template(data);

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: "InnoHire <onboarding@resend.dev>",
        to: [recipientEmail],
        subject,
        html,
      }),
    });

    const emailData = await emailRes.json();

    if (!emailRes.ok) {
      console.error("Resend error:", emailData);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: emailData }),
        { status: emailRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Notification email sent: ${type} to ${recipientEmail}`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
