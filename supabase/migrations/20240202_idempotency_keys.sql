-- Idempotency keys table for safe payment retries

CREATE TABLE IF NOT EXISTS idempotency_keys (
  key TEXT PRIMARY KEY,
  response JSONB NOT NULL,
  status_code INTEGER NOT NULL DEFAULT 200,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '48 hours'
);

CREATE INDEX idx_idempotency_expires ON idempotency_keys(expires_at);
