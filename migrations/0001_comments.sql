-- Cloudflare D1 schema for province comments.
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  province_id TEXT NOT NULL,
  user_id INTEGER,
  author_name TEXT NOT NULL DEFAULT '游客',
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_comments_province_id_created_at
  ON comments (province_id, created_at DESC);
