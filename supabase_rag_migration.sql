-- ============================================================
-- StudyCoreAI — RAG + Knowledge Pipeline Migration
-- Run this in Supabase > SQL Editor
-- ============================================================

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add status column to books (tracks background processing)
ALTER TABLE books ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ready';
-- Values: 'processing' | 'ready' | 'error'

-- 3. Create book_chunks table (raw text chunks + embeddings for fallback)
CREATE TABLE IF NOT EXISTS book_chunks (
    id           BIGSERIAL PRIMARY KEY,
    book_id      INT REFERENCES books(id) ON DELETE CASCADE,
    chunk_index  INT NOT NULL,
    content      TEXT NOT NULL,
    embedding    VECTOR(384)  -- bge-small-en-v1.5 produces 384-dim vectors
);

CREATE INDEX IF NOT EXISTS book_chunks_embedding_idx
    ON book_chunks USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- 4. Create book_knowledge table (AI-structured knowledge, pre-computed per book)
CREATE TABLE IF NOT EXISTS book_knowledge (
    id          BIGSERIAL PRIMARY KEY,
    book_id     INT REFERENCES books(id) ON DELETE CASCADE,
    section     TEXT,   -- 'character', 'event', 'concept', 'definition', 'summary'
    content     TEXT NOT NULL,
    embedding   VECTOR(384)
);

CREATE INDEX IF NOT EXISTS book_knowledge_embedding_idx
    ON book_knowledge USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 50);

-- 5. RPC for raw chunk similarity search (fallback)
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

-- 6. RPC for structured knowledge similarity search (primary)
CREATE OR REPLACE FUNCTION match_knowledge(
    query_embedding VECTOR(384),
    match_book_id   INT DEFAULT NULL,
    match_count     INT DEFAULT 8
)
RETURNS TABLE (book_id INT, section TEXT, content TEXT, similarity FLOAT)
LANGUAGE sql STABLE AS $$
    SELECT
        bk.book_id,
        bk.section,
        bk.content,
        1 - (bk.embedding <=> query_embedding) AS similarity
    FROM book_knowledge bk
    WHERE (match_book_id IS NULL OR bk.book_id = match_book_id)
    ORDER BY bk.embedding <=> query_embedding
    LIMIT match_count;
$$;
