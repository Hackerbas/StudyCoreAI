-- Run this in your Supabase SQL Editor to add the missing columns!
ALTER TABLE books
  ADD COLUMN IF NOT EXISTS title       TEXT,
  ADD COLUMN IF NOT EXISTS author      TEXT,
  ADD COLUMN IF NOT EXISTS max_grade   INTEGER DEFAULT 13,
  ADD COLUMN IF NOT EXISTS year        TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT;

-- Refresh the cache after adding columns
NOTIFY pgrst, reload schema;
