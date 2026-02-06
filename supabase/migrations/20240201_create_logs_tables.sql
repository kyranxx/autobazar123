-- System Logs Table
CREATE TABLE IF NOT EXISTS system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'critical')),
  category TEXT NOT NULL CHECK (category IN ('api', 'auth', 'payment', 'search', 'system', 'admin')),
  message TEXT NOT NULL,
  request_id TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB,
  error_stack TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for system_logs
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_category ON system_logs(category);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_request_id ON system_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_level_created ON system_logs(level, created_at DESC);

-- Admin Audit Logs Table
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_email TEXT,
  action TEXT NOT NULL CHECK (action IN (
    'approve_ad', 'reject_ad', 'delete_ad',
    'ban_user', 'unban_user', 'update_user_credits',
    'update_site_settings', 'feature_ad', 'unfeature_ad',
    'edit_ad', 'delete_user', 'grant_admin', 'revoke_admin', 'other'
  )),
  target_type TEXT NOT NULL CHECK (target_type IN ('ad', 'user', 'setting', 'system')),
  target_id TEXT,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for admin_audit_logs
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target_type ON admin_audit_logs(target_type);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target_id ON admin_audit_logs(target_id);

-- RLS Policies
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read system logs
CREATE POLICY "Admins can read system logs" ON system_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- Service role can insert system logs (for server-side logging)
CREATE POLICY "Service role can insert system logs" ON system_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only admins can read audit logs
CREATE POLICY "Admins can read audit logs" ON admin_audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- Admins can insert audit logs
CREATE POLICY "Admins can insert audit logs" ON admin_audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- Function to clean old logs (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM system_logs
  WHERE created_at < NOW() - INTERVAL '30 days'
  AND level NOT IN ('error', 'critical');
  
  DELETE FROM system_logs
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;
