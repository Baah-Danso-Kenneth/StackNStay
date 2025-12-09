"""Run pgvector schema against DATABASE_URL using asyncpg.

This script is intentionally small and safe: it reads the SQL file
`backend/pgvector_schema.sql` and executes it once on startup. It logs
errors but does not fail startup hard (to avoid blocking other features).
"""
import os
import asyncio
import asyncpg
from pathlib import Path

SQL_PATH = Path(__file__).resolve().parents[1] / "pgvector_schema.sql"

async def run_pgvector_migrations(database_url: str | None):
    if not database_url:
        return False

    if not SQL_PATH.exists():
        print(f"pgvector schema file not found at {SQL_PATH}")
        return False

    sql = SQL_PATH.read_text()

    try:
        conn = await asyncpg.connect(database_url)
        try:
            # Create simple migrations table if not exists
            await conn.execute(
                """
                CREATE TABLE IF NOT EXISTS schema_migrations (
                    id SERIAL PRIMARY KEY,
                    name TEXT UNIQUE,
                    applied_at TIMESTAMP WITH TIME ZONE DEFAULT now()
                )
                """
            )

            migration_name = "pgvector_v1"
            row = await conn.fetchrow("SELECT name FROM schema_migrations WHERE name = $1", migration_name)
            if row:
                print(f"ℹ️ Migration '{migration_name}' already applied; skipping pgvector SQL")
                return True

            # asyncpg's execute can run multiple statements when separated by semicolons
            await conn.execute(sql)

            # record migration
            await conn.execute("INSERT INTO schema_migrations(name) VALUES($1)", migration_name)

            print("✅ pgvector schema executed and recorded successfully")
            return True
        finally:
            await conn.close()

    except Exception as e:
        print(f"⚠️ Failed to run pgvector migrations: {e}")
        return False


def run_sync(database_url: str | None):
    return asyncio.get_event_loop().run_until_complete(run_pgvector_migrations(database_url))
