CREATE TABLE IF NOT EXISTS ai_content_reports (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  app_version TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  reason TEXT NOT NULL,
  coach_message TEXT NOT NULL,
  preceding_user_message TEXT,
  comment TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_content_reports_expires_at
  ON ai_content_reports(expires_at);

CREATE TABLE IF NOT EXISTS report_rate_limits (
  ip_hash TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  request_count INTEGER NOT NULL,
  PRIMARY KEY (ip_hash, window_start)
);

CREATE INDEX IF NOT EXISTS idx_report_rate_limits_window
  ON report_rate_limits(window_start);
