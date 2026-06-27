#!/bin/sh
set -e

echo "Applying database schema..."
npx prisma db push --accept-data-loss

echo "Seeding database..."
npx tsx prisma/seed.ts || echo "Seeding might have failed or already completed."

echo "Starting Next.js..."
exec node server.js
