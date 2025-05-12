-- Migration: Adding MDBList API Keys table
-- Date: 12.05.2025

-- MDBList API Keys for users
CREATE TABLE IF NOT EXISTS mdblist_api_keys (
  user_id TEXT PRIMARY KEY,
  api_key TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- No need for an additional index on user_id since it's already a PRIMARY KEY 