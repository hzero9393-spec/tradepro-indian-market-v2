#!/bin/bash
# Push Prisma schema to Turso database
# Usage: ./push-schema.sh

export TURSO_DATABASE_URL="libsql://tradepro-hzero9393-spec.aws-ap-south-1.turso.io"
export TURSO_AUTH_TOKEN="eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Nzk4Njk4OTIsImlkIjoiMDE5ZTY4N2ItNGEwMS03OThlLWE1NDUtNThkMTA4NjJjNmNjIiwicmlkIjoiOWFjNThjNWEtMjRjYi00YTA2LWE3ZDQtYTM2OGFlNTlmOWU5In0._jJLD3f14aKBCtWgUEqyVawLmKKV_mbTgULVOv2uwexDaZEV1CKUT6vhgZekZnOr5JCGEQmdWxAy6sy4OoFnBg"

# Copy Turso schema as main schema
cp /home/z/my-project/tradepro-indian-market/prisma/schema.turso.prisma /home/z/my-project/tradepro-indian-market/prisma/schema.prisma

# Generate Prisma client
cd /home/z/my-project/tradepro-indian-market
npx prisma generate 2>&1

# Generate SQL and push to Turso
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > /tmp/turso-schema.sql 2>&1

# Push schema using the push-to-turso script
TURSO_DATABASE_URL="$TURSO_DATABASE_URL" TURSO_AUTH_TOKEN="$TURSO_AUTH_TOKEN" node scripts/push-to-turso.js 2>&1

echo "✅ Schema push to Turso complete!"
