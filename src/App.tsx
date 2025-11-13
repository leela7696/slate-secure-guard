import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Signup from "./pages/auth/Signup";
import Login from "./pages/auth/Login";
import VerifyOtp from "./pages/auth/VerifyOtp";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Users from "./pages/admin/Users";
import AuditLogs from "./pages/admin/AuditLogs";
import Roles from "./pages/admin/Roles";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth/signup" element={<Signup />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/verify-otp" element={<VerifyOtp />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin/users" element={<Users />} />
          <Route path="/admin/audit-logs" element={<AuditLogs />} />
          <Route path="/admin/roles" element={<Roles />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
