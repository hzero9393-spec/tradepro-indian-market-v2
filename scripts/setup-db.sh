#!/bin/bash
# Setup database provider based on DATABASE_URL
# SQLite for local dev, PostgreSQL for Vercel production

SCHEMA_FILE="prisma/schema.prisma"

if [[ "$DATABASE_URL" == postgresql://* ]]; then
  echo "🔧 PostgreSQL detected - switching schema provider..."
  # Replace SQLite provider with PostgreSQL
  sed -i 's/provider = "sqlite"/provider = "postgresql"/' "$SCHEMA_FILE"
  # Add directUrl for Supabase connection pooling
  if ! grep -q "directUrl" "$SCHEMA_FILE"; then
    sed -i 's|url      = env("DATABASE_URL")|url       = env("DIRECT_URL")\n  directUrl = env("DATABASE_URL")|' "$SCHEMA_FILE"
  fi
  echo "✅ Schema switched to PostgreSQL"
else
  echo "🔧 SQLite detected - keeping SQLite provider"
fi

# Generate Prisma client
npx prisma generate
