#!/bin/bash
echo "Stopping production containers (if running)..."
docker compose down

echo "Starting development containers with Hot Module Replacement..."
docker compose -f docker-compose.dev.yml up -d

echo "Waiting for database to be ready..."
sleep 5

echo "Container is starting up. It will automatically install dependencies and push the database schema."
echo "--------------------------------------------------------"
echo "Development Server will be LIVE in about 30 seconds!"
echo "Any changes pulled from GitHub will reflect INSTANTLY."
echo "No need to rebuild docker images!"
echo "To view startup progress, run: docker logs -f music-coin-app-dev"
echo "--------------------------------------------------------"
