#!/bin/bash
set -e

echo "=========================================="
echo "  Music Coin - Automated Deployment Setup "
echo "=========================================="

# 1. Check for .env file
if [ ! -f .env ]; then
    echo "❌ ERROR: .env file is missing!"
    echo "You must provide your environment variables before deploying."
    echo ""
    echo "Run this command to create it securely using your base64 string:"
    echo 'echo "YOUR_BASE64_STRING_HERE" | base64 -d | sudo tee .env > /dev/null'
    echo ""
    exit 1
fi
echo "✅ .env file found."

# 2. Check and Setup Swap Memory (to prevent Docker build from crashing on 1GB RAM instances)
SWAP_EXISTS=$(swapon --show | wc -l)
if [ "$SWAP_EXISTS" -le 1 ]; then
    echo "⚙️  No swap memory found. Provisioning 2GB swap file to prevent Out-Of-Memory errors..."
    sudo fallocate -l 2G /swapfile || true
    sudo chmod 600 /swapfile || true
    sudo mkswap /swapfile || true
    sudo swapon /swapfile || true
    echo "✅ Swap memory enabled."
else
    echo "✅ Swap memory already active."
fi

# 3. Pull latest code
echo "📥 Pulling latest updates from GitHub..."
git pull || echo "⚠️  Git pull failed or skipped, continuing to build..."

# 4. Build and Deploy
echo "🚀 Building and starting Docker containers..."
sudo docker compose up --build -d

echo "⏳ Waiting for database to initialize (10 seconds)..."
sleep 10

echo "🔧 Pushing database schema..."
sudo docker compose exec -T app npx prisma db push --accept-data-loss

echo "🌱 Seeding database..."
sudo docker compose exec -e DATABASE_URL="postgresql://musiccoin:musiccoin_pass@postgres:5432/music_coin_demo?schema=public" -T app npx tsx prisma/seed.ts || echo "⚠️  Seeding failed or already complete."

echo "=========================================="
echo "🎉 Deployment successful!"
echo "The application is now running."
echo "You can check the logs anytime with: sudo docker logs -f music-coin-app"
echo "=========================================="
