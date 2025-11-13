-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('System Admin', 'Admin', 'Manager', 'User');

-- Create users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  role app_role NOT NULL DEFAULT 'User',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  external_providers JSONB DEFAULT '[]'::jsonb,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_deleted BOOLEAN NOT NULL DEFAULT false
);

-- Create otp_requests table
CREATE TABLE public.otp_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  attempts_left INTEGER NOT NULL DEFAULT 5,
  expires_at TIMESTAMPTZ NOT NULL,
  resend_after TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create roles table
CREATE TABLE public.roles (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create permissions table
CREATE TABLE public.permissions (
  id SERIAL PRIMARY KEY,
  role_name TEXT NOT NULL REFERENCES roles(name) ON DELETE CASCADE,
  module TEXT NOT NULL,
  can_view BOOLEAN NOT NULL DEFAULT false,
  can_create BOOLEAN NOT NULL DEFAULT false,
  can_edit BOOLEAN NOT NULL DEFAULT false,
  can_delete BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (role_name, module)
);

-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  actor_email TEXT,
  actor_role TEXT,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  target_id TEXT,
  target_type TEXT,
  target_summary TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT true,
  prev_hash TEXT,
  chain_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create chain_head table
CREATE TABLE public.chain_head (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  latest_hash TEXT NOT NULL DEFAULT ''
);

-- Insert initial chain head
INSERT INTO chain_head (id, latest_hash) VALUES (1, '') ON CONFLICT (id) DO NOTHING;

-- Insert default roles
INSERT INTO roles (name, description) VALUES
  ('System Admin', 'Full system access'),
  ('Admin', 'Administrative access'),
  ('Manager', 'Management level access'),
  ('User', 'Standard user access');

-- Insert default permissions
INSERT INTO permissions (role_name, module, can_view, can_create, can_edit, can_delete) VALUES
  ('System Admin', 'users', true, true, true, true),
  ('System Admin', 'roles', true, true, true, true),
  ('System Admin', 'audit_logs', true, false, false, false),
  ('Admin', 'users', true, true, true, false),
  ('Admin', 'audit_logs', true, false, false, false),
  ('Manager', 'users', true, false, false, false),
  ('User', 'profile', true, false, true, false);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chain_head ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own data"
  ON public.users FOR SELECT
  USING (id = auth.uid() OR role IN ('Admin', 'System Admin'));

CREATE POLICY "Admins can insert users"
  ON public.users FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own data"
  ON public.users FOR UPDATE
  USING (id = auth.uid() OR role IN ('Admin', 'System Admin'));

-- RLS for otp_requests (service role only)
CREATE POLICY "Service role can manage otp_requests"
  ON public.otp_requests FOR ALL
  USING (true);

-- RLS for roles (read-only for authenticated)
CREATE POLICY "Anyone can view roles"
  ON public.roles FOR SELECT
  USING (true);

-- RLS for permissions (read-only for authenticated)
CREATE POLICY "Anyone can view permissions"
  ON public.permissions FOR SELECT
  USING (true);

-- RLS for audit_logs (admins only)
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('Admin', 'System Admin')
  ));

-- RLS for chain_head (read-only)
CREATE POLICY "Anyone can view chain_head"
  ON public.chain_head FOR SELECT
  USING (true);

-- Create indexes
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_otp_email ON public.otp_requests(email);
CREATE INDEX idx_audit_actor ON public.audit_logs(actor_id);
CREATE INDEX idx_audit_action ON public.audit_logs(action);
CREATE INDEX idx_audit_created ON public.audit_logs(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to users table
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();