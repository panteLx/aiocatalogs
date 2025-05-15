-- Migration: Adding RPDB API Keys table
-- Date: 2024-08-20

-- RPDB API Keys for users
CREATE TABLE IF NOT EXISTS rpdb_api_keys (
  user_id TEXT PRIMARY KEY,
  api_key TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- No need for an additional index on user_id since it's already a PRIMARY KEY 