-- pgvector schema for StackNStay properties
-- Run this once on your Postgres instance (psql or via migrations)

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS property_embeddings (
  id SERIAL PRIMARY KEY,
  property_id INTEGER,
  title TEXT,
  embedding vector(1024),
  metadata JSONB
);

-- ivfflat index for ANN. Tune 'lists' for dataset size.
CREATE INDEX IF NOT EXISTS idx_property_embeddings_embedding ON property_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
