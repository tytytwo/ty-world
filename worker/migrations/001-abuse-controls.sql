-- Adds the column and indexes the rate limiter needs.
-- Run once per database (local and remote); ALTER errors if already applied.
ALTER TABLE entries ADD COLUMN ip_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_entries_created ON entries (created_at);
CREATE INDEX IF NOT EXISTS idx_entries_ip_created ON entries (ip_hash, created_at);
