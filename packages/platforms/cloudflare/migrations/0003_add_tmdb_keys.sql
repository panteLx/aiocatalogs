-- Migration: Adding RPDB API Keys table
-- Date: 2024-08-20

-- TMDB API Keys
CREATE TABLE IF NOT EXISTS tmdb_api_keys (
  user_id TEXT PRIMARY KEY,
  api_key TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);