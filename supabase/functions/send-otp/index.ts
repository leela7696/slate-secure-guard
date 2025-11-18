import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendOTPRequest {
  name: string;
  email: string;
  password: string;
}

async function sendEmail(to: string, otp: string, name: string) {
  const smtpHost = Deno.env.get('SMTP_HOST')!;
  const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '587');
  const smtpUser = Deno.env.get('SMTP_USER')!;
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

  // Use SMTP via external service
  const response = await fetch(`https://api.smtp2go.com/v3/email/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Smtp2go-Api-Key': smtpPass, // Using SMTP_PASS as API key for smtp2go
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
    console.error('Email send error - Status:', response.status);
    console.error('Email send error - Response:', error);
    throw new Error(`Failed to send email: ${error}`);
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

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  const key = await crypto.subtle.importKey(
    "raw",
    data,
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    key,
    256
  );
  
  const hashArray = new Uint8Array(derivedBits);
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `${saltHex}:${hashHex}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { name, email, password }: SendOTPRequest = await req.json();

    // Validate inputs
    if (!name || !email || !password) {
      return new Response(
        JSON.stringify({ error: 'Name, email, and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 8 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, status')
      .eq('email', email)
      .eq('is_deleted', false)
      .maybeSingle();

    if (existingUser && existingUser.status === 'active') {
      return new Response(
        JSON.stringify({ error: 'Email already registered. Please login instead.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate OTP
    const otp = generateOTP(6);
    const otpHash = await hashPassword(otp);
    const passwordHash = await hashPassword(password);

    const otpExpiryMinutes = 10;
    const resendCooldownSeconds = 60;
    const maxAttempts = 5;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + otpExpiryMinutes * 60 * 1000);
    const resendAfter = new Date(now.getTime() + resendCooldownSeconds * 1000);

    // Delete any existing OTP requests for this email
    await supabase
      .from('otp_requests')
      .delete()
      .eq('email', email);

    // Create new OTP request
    const { error: insertError } = await supabase
      .from('otp_requests')
      .insert({
        email,
        name,
        password_hash: passwordHash,
        otp_hash: otpHash,
        attempts_left: maxAttempts,
        expires_at: expiresAt.toISOString(),
        resend_after: resendAfter.toISOString(),
      });

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    // Send OTP via email
    await sendEmail(email, otp, name);

    console.log(`OTP sent to ${email}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'OTP sent successfully',
        resend_after_seconds: resendCooldownSeconds,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-otp:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});