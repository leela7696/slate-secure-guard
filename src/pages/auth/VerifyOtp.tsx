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
      // TODO: API call to verify OTP
      console.log("Verifying OTP:", otp, "for email:", email);
      toast({
        title: "Success",
        description: "Account created successfully!",
      });
      navigate("/dashboard");
    } catch (error) {
      setAttemptsLeft(prev => prev - 1);
      toast({
        title: "Verification failed",
        description: `Invalid code. ${attemptsLeft - 1} attempts remaining.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      // TODO: API call to resend OTP
      console.log("Resending OTP to:", email);
      setCountdown(60);
      setCanResend(false);
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
      toast({
        title: "Error",
        description: "Failed to resend code. Please try again.",
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
