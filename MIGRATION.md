## Architecture

- **Frontend**: Vite + React (direct connection to Neon via HTTP)
- **Database**: Neon PostgreSQL (serverless)

## Setup Instructions

### 1. Database Setup

1. Create a Neon account at https://neon.tech
2. Create a new project and database
3. Copy your connection string (it looks like: `postgresql://user:password@host.neon.tech/dbname?sslmode=require`)
4. In the Neon SQL Editor, run:

```sql
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  color VARCHAR(100) NOT NULL DEFAULT 'bg-yellow-200 shadow-md',
  rotation INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  pinned BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_pinned ON posts(pinned);
```

### 2. Frontend Setup

```bash
cp .env.example .env
# Edit .env and add your DATABASE_URL from Neon
bun install
bun run dev
```

The app will run on http://localhost:5173