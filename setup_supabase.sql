-- Run this script in your Supabase SQL Editor to fix all permission errors

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    grade_level INTEGER,
    dob TEXT
);

-- 2. Create Books Table
CREATE TABLE IF NOT EXISTS public.books (
    id SERIAL PRIMARY KEY,
    filename TEXT UNIQUE NOT NULL,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    content TEXT,
    subject TEXT,
    min_grade INTEGER
);

-- 3. Create Storage Bucket for PDFs
INSERT INTO storage.buckets (id, name, public) 
VALUES ('pdfs', 'pdfs', false) 
ON CONFLICT (id) DO NOTHING;

-- 4. DISABLE RLS ON TABLES
-- Our Python backend acts as a trusted middleman and validates all requests itself.
-- Disabling RLS allows the backend's anon key to insert and select rows freely.
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.books DISABLE ROW LEVEL SECURITY;

-- 5. STORAGE POLICIES
-- The storage bucket also blocks the anon key by default. We must add open policies 
-- for the 'pdfs' bucket so the backend can upload, read, and delete textbooks!
DROP POLICY IF EXISTS "Allow backend read" ON storage.objects;
CREATE POLICY "Allow backend read" ON storage.objects FOR SELECT USING (bucket_id = 'pdfs');

DROP POLICY IF EXISTS "Allow backend insert" ON storage.objects;
CREATE POLICY "Allow backend insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'pdfs');

DROP POLICY IF EXISTS "Allow backend delete" ON storage.objects;
CREATE POLICY "Allow backend delete" ON storage.objects FOR DELETE USING (bucket_id = 'pdfs');

DROP POLICY IF EXISTS "Allow backend update" ON storage.objects;
CREATE POLICY "Allow backend update" ON storage.objects FOR UPDATE USING (bucket_id = 'pdfs');
