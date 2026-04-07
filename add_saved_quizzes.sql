-- Run this in your Supabase SQL Editor to enable quiz/flashcard save & share

-- saved_quizzes table
CREATE TABLE IF NOT EXISTS public.saved_quizzes (
    id          SERIAL PRIMARY KEY,
    user_id     TEXT NOT NULL,
    username    TEXT NOT NULL,
    name        TEXT NOT NULL,
    type        TEXT NOT NULL CHECK (type IN ('quiz','flashcard')),
    data        JSONB NOT NULL,
    share_code  TEXT UNIQUE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_saved_quizzes_user_id ON public.saved_quizzes (user_id);
-- Index for share code lookups
CREATE INDEX IF NOT EXISTS idx_saved_quizzes_share_code ON public.saved_quizzes (share_code);

-- Disable RLS (backend handles all auth)
ALTER TABLE public.saved_quizzes DISABLE ROW LEVEL SECURITY;
