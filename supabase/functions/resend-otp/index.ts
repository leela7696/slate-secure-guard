import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResendOTPRequest {
  email: string;
}

async function sendEmail(to: string, otp: string, name: string) {
  const smtpPass = Deno.env.get('SMTP_PASS')!;
  const smtpFrom = Deno.env.get('SMTP_FROM') || 'Slate AI <noreply@slateai.com>';

  const emailBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 40px; text-align: center;">
        <h1 style="color: #06b6d4; margin: 0;">Slate AI</h1>
      </div>
      <div style="padding: 40px; background: #ffffff;">
        <h2 style="color: #0f172a; margin-top: 0;">Welcome, ${name}!</h2>
        <p style="color: #475569; font-size: 16px;">Your verification code is:</p>
        <div style="background: #f1f5f9; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; color: #06b6d4; letter-spacing: 8px;">${otp}</span>
        </div>
        <p style="color: #475569; font-size: 14px;">This code expires in 10 minutes.</p>
        <p style="color: #475569; font-size: 14px;">You have 5 attempts to enter the correct code.</p>
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 12px;">If you didn't request this code, please ignore this email or contact support.</p>
        </div>
      </div>
    </div>
  `;

  const response = await fetch(`https://api.smtp2go.com/v3/email/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Smtp2go-Api-Key': smtpPass,
    },
    body: JSON.stringify({
      api_key: smtpPass,
      to: [to],
      sender: smtpFrom,
      subject: 'Your Slate AI Verification Code',
      html_body: emailBody,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Email send error:', error);
    throw new Error('Failed to send email');
  }

  return true;
}

function generateOTP(length: number = 6): string {
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10).toString();
  }
  return otp;
}

async function hashOTP(otp: string): Promise<string> {
  return await bcrypt.hash(otp);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { email }: ResendOTPRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find existing OTP request
    const { data: otpRequest, error: fetchError } = await supabase
      .from('otp_requests')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (fetchError || !otpRequest) {
      return new Response(
        JSON.stringify({ error: 'No pending OTP request found. Please sign up again.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if expired
    const now = new Date();
    const expiresAt = new Date(otpRequest.expires_at);
    if (now > expiresAt) {
      await supabase.from('otp_requests').delete().eq('email', email);
      return new Response(
        JSON.stringify({ error: 'OTP request expired. Please sign up again.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit
    const resendAfter = new Date(otpRequest.resend_after);
    if (now < resendAfter) {
      const retryAfter = Math.ceil((resendAfter.getTime() - now.getTime()) / 1000);
      return new Response(
        JSON.stringify({
          rate_limited: true,
          retry_after: retryAfter,
          message: `Please wait ${retryAfter} seconds before requesting a new code`,
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate new OTP
    const otp = generateOTP(6);
    const otpHash = await hashOTP(otp);

    const resendCooldownSeconds = 60;
    const newResendAfter = new Date(now.getTime() + resendCooldownSeconds * 1000);

    // Update OTP request
    await supabase
      .from('otp_requests')
      .update({
        otp_hash: otpHash,
        resend_after: newResendAfter.toISOString(),
        attempts_left: 5, // Reset attempts
      })
      .eq('email', email);

    // Send new OTP
    await sendEmail(email, otp, otpRequest.name);

    console.log(`OTP resent to ${email}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'New OTP sent successfully',
        resend_after_seconds: resendCooldownSeconds,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in resend-otp:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});