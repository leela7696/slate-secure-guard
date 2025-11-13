import { ReactNode } from "react";
import { Card } from "@/components/ui/card";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-dark p-4">
      <div className="w-full max-width-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            Slate AI
          </h1>
          <p className="text-muted-foreground text-sm">Enterprise Authentication Platform</p>
        </div>
        
        <Card className="p-8 shadow-card">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-foreground mb-2">{title}</h2>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {children}
        </Card>
      </div>
    </div>
  );
};
