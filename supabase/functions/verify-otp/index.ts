import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { create } from "https://deno.land/x/djwt@v2.8/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyOTPRequest {
  email: string;
  otp: string;
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [saltHex, hashHex] = hash.split(':');
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
  
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  
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
  const newHashHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
  
  return newHashHex === hashHex;
}

async function generateJWT(userId: string, email: string, role: string): Promise<string> {
  const jwtSecret = Deno.env.get('JWT_SECRET')!;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(jwtSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const payload = {
    userId,
    email,
    role,
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
  };

  return await create({ alg: "HS256", typ: "JWT" }, payload, key);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { email, otp }: VerifyOTPRequest = await req.json();

    // Validate inputs
    if (!email || !otp) {
      return new Response(
        JSON.stringify({ error: 'Email and OTP are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find OTP request
    const { data: otpRequest, error: fetchError } = await supabase
      .from('otp_requests')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (fetchError || !otpRequest) {
      return new Response(
        JSON.stringify({ error: 'OTP_EXPIRED', message: 'OTP not found or expired' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if expired
    const now = new Date();
    const expiresAt = new Date(otpRequest.expires_at);
    if (now > expiresAt) {
      await supabase.from('otp_requests').delete().eq('email', email);
      return new Response(
        JSON.stringify({ error: 'OTP_EXPIRED', message: 'OTP has expired' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check attempts
    if (otpRequest.attempts_left <= 0) {
      return new Response(
        JSON.stringify({ error: 'OTP_LOCKED', message: 'Too many failed attempts' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify OTP
    const isValid = await verifyPassword(otp, otpRequest.otp_hash);

    if (!isValid) {
      // Decrement attempts
      const newAttempts = otpRequest.attempts_left - 1;
      await supabase
        .from('otp_requests')
        .update({ attempts_left: newAttempts })
        .eq('email', email);

      return new Response(
        JSON.stringify({
          error: 'INVALID_OTP',
          message: 'Invalid OTP code',
          attempts_left: newAttempts,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // OTP is valid - create user
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        name: otpRequest.name,
        email: otpRequest.email,
        password_hash: otpRequest.password_hash,
        role: 'User',
        status: 'active',
        last_login_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      console.error('User creation error:', createError);
      throw createError;
    }

    // Delete OTP request
    await supabase.from('otp_requests').delete().eq('email', email);

    // Generate JWT
    const token = await generateJWT(newUser.id, newUser.email, newUser.role);

    console.log(`User created and verified: ${email}`);

    return new Response(
      JSON.stringify({
        success: true,
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
        redirectTo: '/dashboard',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in verify-otp:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});