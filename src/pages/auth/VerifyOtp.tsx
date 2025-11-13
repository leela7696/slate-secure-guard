import { useState, useEffect } from "react";
import { AuthLayout } from "@/components/layouts/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2, RefreshCw } from "lucide-react";

const VerifyOtp = () => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(5);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      navigate("/auth/signup");
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [email, navigate]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter all 6 digits",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ email, otp }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.error === 'INVALID_OTP') {
          setAttemptsLeft(result.attempts_left);
          throw new Error(`Invalid code. ${result.attempts_left} attempts remaining.`);
        } else if (result.error === 'OTP_EXPIRED') {
          throw new Error('OTP has expired. Please sign up again.');
        } else if (result.error === 'OTP_LOCKED') {
          throw new Error('Too many failed attempts. Please sign up again.');
        }
        throw new Error(result.error || 'Verification failed');
      }

      // Store token and user data
      localStorage.setItem('auth_token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));

      toast({
        title: "Success",
        description: "Account created successfully!",
      });
      navigate("/dashboard");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Verification failed';
      toast({
        title: "Verification failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.rate_limited) {
          toast({
            title: "Please wait",
            description: result.message,
          });
          return;
        }
        throw new Error(result.error || 'Failed to resend code');
      }

      setCountdown(60);
      setCanResend(false);
      setAttemptsLeft(5); // Reset attempts on resend
      
      toast({
        title: "Code sent",
        description: "A new verification code has been sent to your email.",
      });
      
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resend code. Please try again.';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Verify Your Email" 
      subtitle={`We sent a 6-digit code to ${email}`}
    >
      <form onSubmit={handleVerify} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="otp">Verification Code</Label>
          <Input
            id="otp"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            disabled={loading}
            className="text-center text-2xl tracking-widest"
          />
          <p className="text-xs text-muted-foreground text-center">
            Code expires in 10 minutes • {attemptsLeft} attempts remaining
          </p>
        </div>

        <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Verify Code
        </Button>

        <div className="text-center">
          <Button
            type="button"
            variant="ghost"
            onClick={handleResend}
            disabled={!canResend || resendLoading}
            className="text-sm"
          >
            {resendLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {!canResend && !resendLoading && <RefreshCw className="mr-2 h-4 w-4" />}
            {canResend ? "Resend Code" : `Resend in ${countdown}s`}
          </Button>
        </div>
      </form>

      <div className="mt-6 text-center text-sm">
        <Button 
          variant="link" 
          className="p-0 h-auto font-normal text-muted-foreground"
          onClick={() => navigate("/auth/signup")}
        >
          Use a different email
        </Button>
      </div>
    </AuthLayout>
  );
};

export default VerifyOtp;
