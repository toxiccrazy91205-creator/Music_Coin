#!/bin/bash
echo "Stopping production containers (if running)..."
docker compose down

echo "Starting development containers with Hot Module Replacement..."
docker compose -f docker-compose.dev.yml up -d

echo "Waiting for database to be ready..."
sleep 5

echo "Pushing database schema..."
docker compose -f docker-compose.dev.yml exec -T app npx prisma db push

echo "Generating Prisma Client..."
docker compose -f docker-compose.dev.yml exec -T app npx prisma generate

echo "Seeding database..."
docker compose -f docker-compose.dev.yml exec -T app npx prisma db seed

echo "--------------------------------------------------------"
echo "Development Server is LIVE!"
echo "Any changes pulled from GitHub will reflect INSTANTLY."
echo "No need to rebuild docker images!"
echo "To view logs: docker logs -f music-coin-app-dev"
echo "--------------------------------------------------------"
