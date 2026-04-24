import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, fullName, role, token } = await req.json();

    const siteUrl = Deno.env.get("SITE_URL") || "https://id-preview--ded27ee8-b084-4e94-87b3-9472d1e1dc7f.lovable.app";
    const signupUrl = `${siteUrl}/auth?invite=${token}`;

    const roleLabel = role === 'hiring-manager' ? 'Hiring Manager' : 'TAG';

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      console.error("RESEND_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: "InnoHire <onboarding@resend.dev>",
        to: [email],
        subject: "You've been invited to InnoHire",
        html: `
          <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px;">
            <h2 style="color:#1a1a1a;">Welcome to InnoHire, ${fullName}!</h2>
            <p style="color:#444;line-height:1.6;">You've been invited to join as a <strong>${roleLabel}</strong>.</p>
            <p style="margin:24px 0;">
              <a href="${signupUrl}" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:600;">Create Your Account</a>
            </p>
            <p style="color:#888;font-size:13px;">Or copy this link: ${signupUrl}</p>
          </div>
        `,
      }),
    });

    const emailData = await emailRes.json();

    if (!emailRes.ok) {
      console.error("Resend error:", emailData);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: emailData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Invitation email sent to:", email);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error sending invite:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
