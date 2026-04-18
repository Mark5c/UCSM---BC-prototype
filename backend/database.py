import aiosqlite
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "ucms.db")


async def get_db() -> aiosqlite.Connection:
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    try:
        yield db
    finally:
        await db.close()


async def init_db():
    # CREATE TABLE IF NOT EXISTS makes this safe to call on every startup
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("PRAGMA foreign_keys = ON")

        # ── Users ────────────────────────────────────────────────────────────
        await db.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id            TEXT PRIMARY KEY,
                username      TEXT NOT NULL UNIQUE,
                email         TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                created_at    TEXT NOT NULL
            )
        """)

        # ── Projects ─────────────────────────────────────────────────────────
        await db.execute("""
            CREATE TABLE IF NOT EXISTS projects (
                id          TEXT PRIMARY KEY,
                name        TEXT NOT NULL,
                description TEXT,
                owner_id    TEXT REFERENCES users(id) ON DELETE SET NULL,
                visibility  TEXT NOT NULL DEFAULT 'private'
                            CHECK (visibility IN ('private','link','public')),
                share_token TEXT UNIQUE,
                created_at  TEXT NOT NULL,
                updated_at  TEXT NOT NULL
            )
        """)

        # ── Use Cases ────────────────────────────────────────────────────────
        await db.execute("""
            CREATE TABLE IF NOT EXISTS use_cases (
                id                TEXT PRIMARY KEY,
                project_id        TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
                name              TEXT NOT NULL,
                template_type     TEXT NOT NULL CHECK (template_type IN ('cockburn','jacobson')),
                primary_actor     TEXT NOT NULL DEFAULT '',
                supporting_actors TEXT NOT NULL DEFAULT '[]',
                goal              TEXT NOT NULL DEFAULT '',
                preconditions     TEXT NOT NULL DEFAULT '[]',
                postconditions    TEXT NOT NULL DEFAULT '[]',
                main_flow         TEXT NOT NULL DEFAULT '[]',
                alternative_flows TEXT NOT NULL DEFAULT '[]',
                template_extras   TEXT NOT NULL DEFAULT '{}',
                version           INTEGER NOT NULL DEFAULT 1,
                updated_at        TEXT NOT NULL,
                updated_by        TEXT NOT NULL DEFAULT 'anonymous'
            )
        """)

        # ── Use Case Groups ──────────────────────────────────────────────────
        await db.execute("""
            CREATE TABLE IF NOT EXISTS use_case_groups (
                id         TEXT PRIMARY KEY,
                project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
                name       TEXT NOT NULL,
                position   INTEGER NOT NULL DEFAULT 0
            )
        """)

        # ── Relationships ────────────────────────────────────────────────────
        await db.execute("""
            CREATE TABLE IF NOT EXISTS relationships (
                id         TEXT PRIMARY KEY,
                project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
                source_id  TEXT NOT NULL REFERENCES use_cases(id) ON DELETE CASCADE,
                target_id  TEXT NOT NULL REFERENCES use_cases(id) ON DELETE CASCADE,
                type       TEXT NOT NULL CHECK (type IN ('include','extend')),
                note       TEXT
            )
        """)

        # ── Change History ───────────────────────────────────────────────────
        await db.execute("""
            CREATE TABLE IF NOT EXISTS change_history (
                id          TEXT PRIMARY KEY,
                project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
                use_case_id TEXT,
                user_id     TEXT,
                username    TEXT NOT NULL,
                action      TEXT NOT NULL CHECK (action IN ('created','updated','deleted')),
                target_type TEXT NOT NULL CHECK (target_type IN ('use_case','relationship','project')),
                target_name TEXT,
                timestamp   TEXT NOT NULL
            )
        """)

        await db.commit()
