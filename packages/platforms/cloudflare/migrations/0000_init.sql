-- Initialisiere Datenbank-Schema für AIO Catalogs

-- Benutzer-Konfigurationen
CREATE TABLE IF NOT EXISTS user_configs (
  user_id TEXT PRIMARY KEY,
  config TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Indizes für effiziente Abfragen
CREATE INDEX IF NOT EXISTS idx_user_configs_updated 
ON user_configs(updated_at DESC);

-- Initialstatistiken
CREATE TABLE IF NOT EXISTS statistics (
  id INTEGER PRIMARY KEY,
  total_users INTEGER NOT NULL DEFAULT 0,
  total_catalogs INTEGER NOT NULL DEFAULT 0,
  last_updated INTEGER NOT NULL
);

-- Anfangs-Statistik-Eintrag
INSERT INTO statistics (id, total_users, total_catalogs, last_updated)
VALUES (1, 0, 0, unixepoch()); 