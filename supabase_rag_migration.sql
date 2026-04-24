-- ============================================================
-- StudyCoreAI — RAG Migration
-- Run this in Supabase > SQL Editor
-- ============================================================

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create book_chunks table
CREATE TABLE IF NOT EXISTS book_chunks (
    id           BIGSERIAL PRIMARY KEY,
    book_id      INT REFERENCES books(id) ON DELETE CASCADE,
    chunk_index  INT NOT NULL,
    content      TEXT NOT NULL,
    embedding    VECTOR(384)  -- bge-small-en-v1.5 produces 384-dim vectors
);

-- 3. Index for fast cosine similarity search
CREATE INDEX IF NOT EXISTS book_chunks_embedding_idx
    ON book_chunks USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- 4. RPC function used by the backend to do similarity search
CREATE OR REPLACE FUNCTION match_chunks(
    query_embedding VECTOR(384),
    match_book_id   INT DEFAULT NULL,
    match_count     INT DEFAULT 7,
    match_subject   TEXT DEFAULT NULL
)
RETURNS TABLE (book_id INT, filename TEXT, content TEXT, similarity FLOAT)
LANGUAGE sql STABLE AS $$
    SELECT
        c.book_id,
        b.filename,
        c.content,
        1 - (c.embedding <=> query_embedding) AS similarity
    FROM book_chunks c
    JOIN books b ON b.id = c.book_id
    WHERE
        (match_book_id IS NULL OR c.book_id = match_book_id)
        AND (match_subject IS NULL OR match_subject = 'All' OR b.subject = match_subject)
    ORDER BY c.embedding <=> query_embedding
    LIMIT match_count;
$$;
