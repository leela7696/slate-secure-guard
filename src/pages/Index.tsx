import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Shield, Lock, Activity } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Slate AI
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Enterprise-grade authentication platform with OTP verification, 
            role-based access control, and comprehensive audit logging.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="p-6 rounded-lg bg-card border border-border">
            <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Secure Authentication</h3>
            <p className="text-sm text-muted-foreground">
              OTP-based signup with JWT tokens and session management
            </p>
          </div>
          
          <div className="p-6 rounded-lg bg-card border border-border">
            <Lock className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">RBAC System</h3>
            <p className="text-sm text-muted-foreground">
              Fine-grained role-based access control with custom permissions
            </p>
          </div>
          
          <div className="p-6 rounded-lg bg-card border border-border">
            <Activity className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Audit Logs</h3>
            <p className="text-sm text-muted-foreground">
              Tamper-proof blockchain-style audit trail for compliance
            </p>
          </div>
        </div>

        <div className="flex gap-4 justify-center mt-12">
          <Button size="lg" onClick={() => navigate("/auth/signup")}>
            Get Started
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate("/auth/login")}>
            Sign In
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
