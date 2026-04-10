-- Security Hardening: Enabling RLS on all public tables
-- This addresses the Supabase Linter warnings (rls_disabled_in_public)

-- Enable RLS for all tables
ALTER TABLE "alert_configurations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "check_ins" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "commission_structures" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "employees" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "float_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "providers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "transaction_flags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "provider_floats" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "salaries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "agent_registrations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "branches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "worker_balance_snapshots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "alert_history" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "commission_ledger" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "csv_imports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "daily_settlements" ENABLE ROW LEVEL SECURITY;

-- Create basic policies to ensure the app server (service_role) can still work
-- Note: The app server uses the 'postgres' user which bypasses RLS, 
-- but we define these for completeness and to allow future use of service_role.

-- Disable access via PostgREST for all tables by default (No policies added yet)
-- This satisfies the linter while keeping the data private from unauthorized API access.

-- Policy for 'users' table to allow users to see their own data
CREATE POLICY "Users can view their own data" ON "users"
  FOR SELECT
  USING (auth.uid()::text = "openId");

-- Policies for other tables could be added here if direct client-side access to Supabase is needed.
-- For now, we rely on the tRPC server-side logic which bypasses RLS via the owner connection.
